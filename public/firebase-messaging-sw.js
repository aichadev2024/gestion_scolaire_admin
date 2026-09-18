// Service worker Firebase Cloud Messaging — fichier statique servi tel quel (PAS traité par
// Next.js), donc pas d'accès aux variables NEXT_PUBLIC_FIREBASE_*. La config ci-dessous est
// publique (mêmes valeurs que src/lib/firebase.ts) — aucun risque à la laisser en clair ici.
// importScripts (SDK compat) est la seule façon de faire tourner Firebase Messaging dans un
// service worker sans bundler dédié.
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAYQKiZ5D-DuFAhx1MEiGQTFfjk12fGxlk',
  authDomain: 'netaa-ecole.firebaseapp.com',
  projectId: 'netaa-ecole',
  storageBucket: 'netaa-ecole.firebasestorage.app',
  messagingSenderId: '484927578701',
  appId: '1:484927578701:web:e19a7d77dcf826f8f5b204',
});

const messaging = firebase.messaging();

// Affiche la notification quand l'onglet admin n'est pas au premier plan (fermé ou en arrière-plan)
// — les notifications reçues onglet ouvert sont gérées séparément par onMessage() dans firebase.ts.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Netaa École', {
    body: body || '',
    icon: '/netaa-icon.svg',
  });
});
