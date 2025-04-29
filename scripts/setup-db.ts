import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔥 Démarrage de la configuration de la base de données...')

  try {
    // Migrer la base de données
    console.log('📊 Génération des tables...')
    // Note: Normalement vous utiliseriez la commande `prisma migrate` pour cela
    // Mais pour cet exemple, nous utilisons prisma db push
    // Exécutez cette commande manuellement: npx prisma db push

    // Créer un utilisateur de test
    console.log('👤 Création d\'un utilisateur de test...')
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin Utilisateur',
        igAccounts: {
          create: {
            username: 'test_instagram',
            password: await hash('password123', 10), // Stocké chiffré
            isActive: true,
          },
        },
      },
    })

    // Créer des données de test
    console.log('📱 Création de données de test...')
    
    // Création d'une conversation de test
    const conversation = await prisma.conversation.create({
      data: {
        instagramAccount: {
          connect: {
            id: adminUser.igAccounts[0].id,
          },
        },
        participantUsername: 'test_user',
        messages: {
          create: [
            {
              content: 'Bonjour, j\'ai une question sur votre service.',
              sentAt: new Date(),
              isFromUser: true,
            },
          ],
        },
      },
    })

    // Création d'une réponse IA de test
    await prisma.aIResponse.create({
      data: {
        message: {
          connect: {
            id: conversation.messages[0].id,
          },
        },
        suggestedResponse: 'Bonjour ! Je serais ravi de répondre à votre question. Comment puis-je vous aider aujourd\'hui ?',
        status: 'pending',
      },
    })

    // Création d'un log de cron de test
    await prisma.cronLog.create({
      data: {
        jobType: 'fetch-messages',
        status: 'completed',
        details: JSON.stringify({
          accountsProcessed: 1,
          totalNewMessages: 1,
          totalResponses: 1,
        }),
      },
    })

    console.log('✅ Configuration de la base de données terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
