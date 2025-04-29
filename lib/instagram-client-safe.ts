// Ce wrapper sécurise l'utilisation de instagram-private-api en vérifiant qu'on est côté serveur

// Cache pour stocker les instances d'IgApiClient
const clientCache = new Map();

/**
 * Fonction qui retourne une instance de IgApiClient ou null si côté client
 */
export function getInstagramClient() {
  // Vérifier qu'on est côté serveur
  if (typeof window !== 'undefined') {
    console.error('Tentative d\'utilisation d\'Instagram API côté client')
    return null;
  }

  try {
    // Import dynamique pour éviter les erreurs de bundling
    const { IgApiClient } = require('instagram-private-api');
    return new IgApiClient();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'API Instagram:', error);
    return null;
  }
}

// Fonction utilitaire pour ajouter un délai
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fonction pour se connecter à un compte Instagram avec retry et throttling
 */
export async function loginToInstagram(username: string, password: string, retryCount = 0) {
  const ig = getInstagramClient();
  if (!ig) {
    throw new Error('Instagram API non disponible');
  }

  // Vérifier si nous avons déjà un client en cache
  const cacheKey = `${username}:${password}`;
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey);
  }

  try {
    ig.state.generateDevice(username);
    
    // Ajouter un petit délai aléatoire pour éviter la détection de bots
    await delay(Math.random() * 1000 + 500); 
    
    // Essayer de se connecter
    const loginResult = await ig.account.login(username, password);
    
    // Mettre en cache le client pour une utilisation future
    clientCache.set(cacheKey, loginResult);
    
    return loginResult;
  } catch (error: any) {
    console.error('Erreur de connexion Instagram:', error);
    
    // Si c'est une erreur de challenge (authentification à deux facteurs)
    if (error.name === 'IgCheckpointError') {
      throw new Error('Authentification à deux facteurs requise. Veuillez vous connecter manuellement à Instagram et autoriser l\'appareil.');
    }
    
    // Si c'est une erreur de limite de débit, attendre et réessayer
    if (error.name === 'IgResponseError' && error.message.includes('rate limited')) {
      if (retryCount < 3) {
        // Attendre de plus en plus longtemps entre les tentatives
        const waitTime = Math.pow(2, retryCount) * 2000;
        console.log(`Rate limited, retrying in ${waitTime}ms...`);
        await delay(waitTime);
        return loginToInstagram(username, password, retryCount + 1);
      }
    }
    
    // Si c'est un mauvais mot de passe, on renvoie un message d'erreur clair
    if (error.name === 'IgLoginBadPasswordError') {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect.');
    }
    
    throw error;
  }
}

/**
 * Récupère les messages directs d'un compte Instagram
 */
export async function fetchDirectMessages(username: string, password: string) {
  try {
    // D'abord se connecter
    await loginToInstagram(username, password);
    
    const ig = getInstagramClient();
    if (!ig) {
      throw new Error('Instagram API non disponible');
    }
    
    // Récupérer les threads
    const threads = await ig.feed.directInbox().items();
    return threads;
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    throw error;
  }
}

/**
 * Envoie un message direct
 */
export async function sendDirectMessage(username: string, password: string, threadId: string, text: string) {
  try {
    // D'abord se connecter
    await loginToInstagram(username, password);
    
    const ig = getInstagramClient();
    if (!ig) {
      throw new Error('Instagram API non disponible');
    }
    
    // Envoyer le message
    await ig.directThread.broadcast({
      thread_ids: [threadId],
      text
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
}
