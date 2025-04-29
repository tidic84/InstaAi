import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Commencer | InstaApp",
  description: "Commencez à utiliser InstaApp pour gérer vos comptes Instagram",
}

export default function GetStartedPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Bienvenue sur InstaApp</h1>
      <p className="mb-4">Suivez ces étapes pour commencer :</p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">1. Créez votre compte</h2>
          <p>Si ce n'est pas déjà fait, inscrivez-vous pour obtenir un compte.</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">2. Connectez vos comptes Instagram</h2>
          <p>Ajoutez vos comptes Instagram pour commencer à les gérer.</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">3. Explorez les fonctionnalités</h2>
          <p>Découvrez toutes les possibilités offertes par InstaApp.</p>
        </div>
      </div>
    </div>
  )
}
