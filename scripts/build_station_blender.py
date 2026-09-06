"""Build the editable orbital station concept and a material-batched web GLB."""
import bpy
import bmesh
import math
import os
import json
from mathutils import Vector

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(base, 'assets', 'station')
web = os.path.join(base, 'public', 'models')
os.makedirs(out, exist_ok=True)
os.makedirs(web, exist_ok=True)
# This process is launched with --factory-startup, never against a user's open file.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
model = bpy.data.collections.new('orbital_station')
scene.collection.children.link(model)

def material(name, color, metal=0.0, rough=.5):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = rough
    return m

hull = material('pearl_alloy', (.58,.65,.7), .55, .38)
ivory = material('ceramic_panels', (.79,.8,.76), .18, .5)
frame = material('titanium_frame', (.22,.29,.33), .8, .32)
dark = material('recess_seals', (.027,.045,.06), .3, .55)
gold = material('thermal_blanket', (.36,.23,.09), .8, .46)
solar = material('photovoltaic_cells', (.016,.045,.095), .65, .24)
light = material('navigation_light', (.18,.7,.85), .25, .25)
bsdf = light.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Emission Color'].default_value = (.1,.55,.8,1)
bsdf.inputs['Emission Strength'].default_value = 2

def finish(o, name, mat):
    o.name = name
    for c in list(o.users_collection):
        c.objects.unlink(o)
    model.objects.link(o)
    o.data.materials.append(mat)
    return o

def box(name, p, scale, mat=hull, angle=0, bevel=0):
    mesh=bpy.data.meshes.new(name)
    verts=[(x*scale[0]/2,y*scale[1]/2,z*scale[2]/2) for x,y,z in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    mesh.from_pydata(verts,[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)])
    if bevel:
        bm=bmesh.new();bm.from_mesh(mesh)
        bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bevel,segments=2,affect='EDGES')
        bm.to_mesh(mesh);bm.free()
    mesh.update()
    o=bpy.data.objects.new(name,mesh);model.objects.link(o);mesh.materials.append(mat)
    o.location=p
    o.rotation_euler.z = angle
    return o

def cylinder(name, p, radius, depth, mat=frame, vertices=32):
    mesh=bpy.data.meshes.new(name)
    v=[(radius*math.cos(i*math.tau/vertices),radius*math.sin(i*math.tau/vertices),z) for z in [-depth/2,depth/2] for i in range(vertices)]
    faces=[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
    faces.extend([tuple(reversed(range(vertices))),tuple(range(vertices,vertices*2))])
    mesh.from_pydata(v,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);model.objects.link(o);mesh.materials.append(mat);o.location=p
    for face in o.data.polygons:
        face.use_smooth = len(face.vertices)==4
    return o

def beam(name,a,b,r=.06,mat=frame):
    a,b=Vector(a),Vector(b)
    o=cylinder(name,(a+b)/2,r,(b-a).length,mat,8)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o

def polar(r,a,z): return (r*math.cos(a),r*math.sin(a),z)

def sector(name,ri,ro,z,depth,a0,a1,mat,steps=6):
    verts=[]
    for zz in [z-depth/2,z+depth/2]:
        for r in [ri,ro]:
            verts.extend(polar(r,a0+(a1-a0)*i/steps,zz) for i in range(steps+1))
    n=steps+1;faces=[]
    for i in range(steps):
        faces.extend([(i,i+1,n+i+1,n+i), (2*n+i,3*n+i,3*n+i+1,2*n+i+1),
                      (i,2*n+i,2*n+i+1,i+1),(n+i,n+i+1,3*n+i+1,3*n+i)])
    faces.extend([(0,n,3*n,2*n),(steps,2*n+steps,3*n+steps,n+steps)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);model.objects.link(o);mesh.materials.append(mat)
    return o

# Broad double habitat ring, axial separation makes its silhouette legible.
for layer,z in enumerate([-5.8,5.8]):
    for i in range(64):
        a=i*math.tau/64;step=math.tau/64
        sector('habitat_pressure_segment',19.7,23.5,z,3.4,a+.006,a+step-.006,hull,4)
        sector('outer_armor_tile',23.52,23.8,z,2.7,a+.012,a+step-.012,ivory,4)
        mid=a+step/2
        for side in [-1,1]:
            sector('face_panel',20.1,23.1,z+side*1.77,.12,a+.013,a+step-.013,ivory,4)
            box('service_hatch',polar(21.7,mid,z+side*1.87),(1.15,1.55,.12),frame,mid,.04)
            box('hatch_inset',polar(21.7,mid,z+side*1.96),(.84,1.22,.06),dark,mid)
        if i%4==0:
            box('thermal_service_pack',polar(24,mid,z),(.75,1.3,1.8),ivory,mid,.08)
            beam('inspection_antenna',polar(24.5,mid,z),polar(26,mid,z),.025)
        if i%8==0:
            box('running_light',polar(23.86,mid,z+.65),(.06,.3,.3),light,mid)
    for r in [19.75,23.6]:
        for zz in [z-1.95,z+1.95]:
            sector('rim_rail',r-.06,r+.06,zz,.12,0,math.tau,frame,192)

# Axial bridges bind the rings into a volume rather than two flat outlines.
for i in range(16):
    a=i*math.tau/16
    for r in [20.2,23]:
        beam('axial_longeron',polar(r,a,-4),polar(r,a,4),.12)
        for j in range(4):
            z=-4+j*2
            beam('cross_brace',polar(r,a-.025,z),polar(r,a+.025,z+2),.055)
            beam('cross_brace',polar(r,a+.025,z),polar(r,a-.025,z+2),.055)
    if i%2==1:
        box('bridge_equipment',polar(21.7,a,0),(2.4,1.25,3.5),gold,a,.12)

# Smaller forward ring and central spine create the three depth scales in the reference.
for i in range(48):
    a=i*math.tau/48;step=math.tau/48
    sector('forward_ring',12.7,14.8,11,2.1,a+.008,a+step-.008,hull,4)
    box('forward_panel',polar(13.8,a+step/2,12.14),(1.5,1.4,.15),ivory,a+step/2,.035)
cylinder('central_spine',(0,0,0),3.8,29,frame,64)
for z,r,d in [(-11,5,3),(-5,5.6,4),(3,6,4),(10,5.2,4),(15,3.6,3)]:
    cylinder('axial_module',(0,0,z),r,d,hull,64)
    for i in range(20):
        a=i*math.tau/20
        box('spine_panel',polar(r+.05,a,z),(.17,1.05,d*.82),ivory,a,.04)
for z,r in [(17,3),(17.3,2.55),(17.6,2),(18,1.4)]:
    cylinder('docking_collar',(0,0,z),r,.35,hull if r in [3,2] else dark,48)
box('axial_hatch',(0,0,18.2),(1.6,2,.18),ivory,bevel=.12)
cylinder('forward_transfer_tunnel',(0,0,26),1.55,15,hull,32)
for z in [20,23,26,29,32]:
    cylinder('tunnel_collar',(0,0,z),1.7,.18,frame,32)
    for i in range(4):
        a=i*math.pi/2
        beam('tunnel_cage',polar(2.15,a,z-1.4),polar(2.15,a,z+1.4),.06)
        beam('tunnel_diagonal',polar(2.15,a,z-1.4),polar(2.15,a+math.pi/2,z+1.4),.035)
cylinder('forward_docking_face',(0,0,33.7),1.85,.4,ivory,48)
cylinder('forward_docking_seal',(0,0,33.96),1.35,.12,dark,48)

for i in range(8):
    a=(i+.5)*math.tau/8
    for z in [-5.8,5.8]:
        for offset in [-.55,.55]:
            def p(r,zz): return (r*math.cos(a)-offset*math.sin(a),r*math.sin(a)+offset*math.cos(a),zz)
            beam('spoke_chord',p(5,z),p(19.6,z),.13)
        for j in range(9):
            r=5+j*1.62
            beam('spoke_lattice',polar(r,a-.04,z),polar(r+1.62,a+.04,z),.065)
            beam('spoke_lattice',polar(r,a+.04,z),polar(r+1.62,a-.04,z),.065)
        if i%2==0:
            box('radial_transfer_module',polar(11.5,a,z),(7,1.25,1.45),hull,a,.16)
    beam('forward_ring_stay',polar(13.7,a,10),polar(19.8,a,7.4),.18)

# Four front access pods: hollow shells and actual rectangular front openings.
ports=['courses','achievements','research','blog']
for i,name in enumerate(ports):
    a=i*math.pi/2;cx,cy,_=polar(28,a,0)
    pod=bpy.data.objects.new('port_'+name,None);model.objects.link(pod)
    pod.location=(cx,cy,18);pod['route']='/'+name
    before=set(model.objects)
    for j in range(8):
        o=sector('pod_shell_'+name,2.98,3.15,14.5,10,j*math.tau/8+.008,(j+1)*math.tau/8-.008,ivory,12)
        o.location.x=cx;o.location.y=cy
    angles=sorted(set([j*math.tau/64 for j in range(64)]+[math.atan2(y,x)%math.tau for x in [-1.25,1.25] for y in [-1.65,1.65]]))
    n=len(angles);verts=[]
    for z in [-.11,.11]:
        for outer in [False,True]:
            for aa in angles:
                dx,dy=math.cos(aa),math.sin(aa)
                r=(-.35*dy+math.sqrt(2.96**2-.35**2*dx**2)) if outer else min(1.25/max(abs(dx),1e-9),1.65/max(abs(dy),1e-9))
                verts.append((r*dx,.35+r*dy,z))
    faces=[]
    for j in range(n):
        k=(j+1)%n
        faces.extend([(j,k,n+k,n+j),(2*n+j,3*n+j,3*n+k,2*n+k),(j,2*n+j,2*n+k,k),(n+j,n+k,3*n+k,3*n+j)])
    mesh=bpy.data.meshes.new('open_bulkhead');mesh.from_pydata(verts,[],faces);mesh.update()
    cap=bpy.data.objects.new('pod_front_'+name,mesh);model.objects.link(cap);mesh.materials.append(hull);cap.location=(cx,cy,19.65)
    assert not cap.ray_cast(Vector((0,.35,2)),Vector((0,0,-1)))[0], 'Viewport must remain open'
    for x in [-1.32,1.32]:
        box('window_jamb',(cx+x,cy+.35,19.85),(.14,3.55,.2),frame,bevel=.025)
    for y in [-1.37,2.07]:
        box('window_lintel',(cx,cy+y,19.85),(2.76,.14,.2),frame,bevel=.025)
    for zz in [9.5,12,15,17,19.5]:
        o=sector('pod_collar',3.14,3.27,zz,.12,0,math.tau,frame,64);o.location.x=cx;o.location.y=cy
    for j in range(6):
        aa=j*math.tau/6
        box('pod_equipment',(cx+3.3*math.cos(aa),cy+3.3*math.sin(aa),14),(.32,.8,1.7),gold if j%3==0 else frame,aa,.04)
    beam('pod_connection',polar(23.5,a,7.3),polar(25,a,12.5),.45,hull)
    for da in [-.025,.025]:
        beam('pod_support',polar(23.5,a+da,6),polar(25,a+da,15),.12)
    for obj in set(model.objects)-before:
        obj['port_id']=name

# Large paired solar wings, with cell seams modeled only at useful viewing scales.
for side in [-1,1]:
    for y in [-18,18]:
        beam('array_root_brace',(side*math.sqrt(23**2-y*y),y,-4.1),(side*20,y,-1),.22)
        beam('array_spar',(side*20,y,-1),(side*40,y,-1),.18)
        for k in range(7):
            x=side*(26+k*1.85)
            for yy in [-2.9,2.9]:
                box('solar_backplate',(x,y+yy,-1),(1.76,5.4,.12),frame)
                box('solar_cells',(x,y+yy,-.91),(1.62,5.24,.025),solar)
                for n in range(8):
                    box('cell_busbar',(x,y+yy-2.5+n*.7,-.885),(1.6,.018,.012),hull)
        for j in range(6):
            beam('array_lattice',(side*(20+j*3),y-.35,-1.3),(side*(23+j*3),y+.35,-1.3),.04)

# Communications booms and visible rim equipment.
for a in [math.pi/4,3*math.pi/4,5*math.pi/4,7*math.pi/4]:
    for off in [-.35,.35]:
        beam('comms_mast',polar(23.8,a+off/24,5.8),polar(31,a+off/31,5.8),.055)
    for j in range(7):
        beam('mast_brace',polar(24+j,a-.012,5.8),polar(25+j,a+.012,5.8),.035)
    box('sensor_head',polar(31,a,5.8),(1.2,1.4,.8),ivory,a,.1)
    beam('sensor_whip',polar(31,a,6.2),polar(31,a,8),.022)

# Studio preview: model is lit as a solid object, with an uncluttered background.
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.012,.018,.028,1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.25
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1440;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
def area(name,p,power,size,color):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=p
    o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
area('key',(10,-25,55),42000,30,(1,.91,.8))
area('fill',(-45,-10,20),30000,35,(.63,.78,1))
area('rim',(25,40,-5),50000,25,(.7,.85,1))
cam_data=bpy.data.cameras.new('presentation_camera');cam=bpy.data.objects.new('presentation_camera',cam_data)
scene.collection.objects.link(cam);cam.location=(63,-76,58);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler()
cam.rotation_euler.rotate_axis('Z',-math.pi/3)
cam_data.type='ORTHO';cam_data.ortho_scale=103;scene.camera=cam
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.join(out,'station_preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'orbital_station.blend'))

# Preserve editable .blend, batch only the exported meshes by material and route.
bpy.ops.object.select_all(action='DESELECT')
groups={}
for obj in list(model.objects):
    if obj.type=='MESH': groups.setdefault((obj.data.materials[0].name,obj.get('port_id','')),[]).append(obj)
for (mat,port),objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();bpy.context.object.name=(port+'_' if port else '')+mat
bpy.ops.object.select_all(action='DESELECT')
for obj in model.objects: obj.select_set(True)
glb=os.path.join(web,'orbital_station.glb')
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_yup=False,export_extras=True)
triangles=sum(len(p.vertices)-2 for o in model.objects if o.type=='MESH' for p in o.data.polygons)
with open(os.path.join(out,'model_stats.json'),'w',encoding='utf-8') as f:
    json.dump({'triangles':triangles,'mesh_batches':len(groups),'glb_bytes':os.path.getsize(glb),'coordinate_system':'XY ring, Z axis; GLB exported without axis conversion','stage':'local homepage integration; cabin radius 28, entrance z 19.65'},f,indent=2)
bpy.ops.render.render(write_still=True)
print('STATION_COMPLETE',triangles,os.path.getsize(glb))
