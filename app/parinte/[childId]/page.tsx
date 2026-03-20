import ParentDashboardPage from '../../components/ParentDashboard'

export default function ParintePage({ params }: { params: { childId: string } }) {
  return <ParentDashboardPage childId={params.childId} />
}