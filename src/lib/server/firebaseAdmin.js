import * as dotenv from 'dotenv';
dotenv.config();
import admin from 'firebase-admin';

let serviceAccount;

try {
	serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY);
} catch (error) {
	console.error('Error parsing service account key:', error);
}

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount)
		// Optionally, you can also set the databaseURL
		// databaseURL: 'https://your-database-name.firebaseio.com'
	});
}

export const adminAuth = admin.auth();
