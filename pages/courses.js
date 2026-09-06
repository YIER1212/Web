import CoursesPage from '@/components/research/CoursesPage'
import courses from '@/data/courses.json'

export default CoursesPage

export async function getStaticProps() {
  // Example records are available only in the local development preview.
  const preview = process.env.NODE_ENV === 'development' && courses.length === 0
  const records = preview ? (await import('@/data/course-examples.json')).default : courses
  return { props: { courses: records, preview } }
}
