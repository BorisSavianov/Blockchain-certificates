// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import {
	getAuth,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyDJzd4W7SWB8gksfHG6-jl84nE_Cvbwtxg',
	authDomain: 'blockchain-app-da339.firebaseapp.com',
	projectId: 'blockchain-app-da339',
	storageBucket: 'blockchain-app-da339.appspot.com',
	messagingSenderId: '288693749296',
	appId: '1:288693749296:web:440826615fad4ff01c4ff5',
	measurementId: 'G-1R09BXEF9P'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export {
	auth,
	googleProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	updateProfile,
	db,
	doc,
	setDoc,
	getDoc
};
