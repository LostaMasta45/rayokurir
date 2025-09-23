import PersistenceTester from "@/components/persistence/persistence-tester"

export const metadata = {
  title: "Tes Persistensi Supabase",
}

export default function Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PersistenceTester />
    </main>
  )
}
