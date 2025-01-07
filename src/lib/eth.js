import { ethers } from 'ethers';

// Check if window is defined (client-side)
const isBrowser = typeof window !== 'undefined';

let provider;
let signer;

// Initialize provider and signer if on the client-side
if (isBrowser) {
	if (window.ethereum) {
		provider = new ethers.providers.Web3Provider(window.ethereum);
		await provider.send('eth_requestAccounts', []); // Request accounts from MetaMask
		signer = provider.getSigner();
	} else {
		console.error('Ethereum provider not found. Please install MetaMask or another Web3 provider.');
	}
}

// Deployed contract address and ABI
const contractAddress = '0x3828334809e3edbe6542a113c0e8f22661865926'; // Replace with your contract address
const abi = [
	{
		inputs: [
			{ internalType: 'address', name: 'student', type: 'address' },
			{ internalType: 'string', name: 'courseName', type: 'string' },
			{ internalType: 'string', name: 'studentName', type: 'string' },
			{ internalType: 'string', name: 'email', type: 'string' },
			{ internalType: 'string', name: 'dateIssued', type: 'string' },
			{ internalType: 'bytes', name: 'signature', type: 'bytes' }
		],
		name: 'issueCertificate',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'address', name: 'student', type: 'address' }],
		name: 'getCertificatesByAddress',
		outputs: [
			{
				components: [
					{ internalType: 'string', name: 'courseName', type: 'string' },
					{ internalType: 'string', name: 'studentName', type: 'string' },
					{ internalType: 'string', name: 'email', type: 'string' },
					{ internalType: 'string', name: 'dateIssued', type: 'string' },
					{ internalType: 'bytes', name: 'signature', type: 'bytes' }
				],
				internalType: 'struct Certificate.CertificateInfo[]',
				name: '',
				type: 'tuple[]'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: 'address', name: 'student', type: 'address' },
			{ indexed: false, internalType: 'string', name: 'courseName', type: 'string' },
			{ indexed: false, internalType: 'string', name: 'studentName', type: 'string' },
			{ indexed: false, internalType: 'string', name: 'email', type: 'string' },
			{ indexed: false, internalType: 'string', name: 'dateIssued', type: 'string' },
			{ indexed: false, internalType: 'bytes', name: 'signature', type: 'bytes' }
		],
		name: 'CertificateIssued',
		type: 'event'
	}
];

// Create contract instance only on client-side
export const contract =
	isBrowser && provider ? new ethers.Contract(contractAddress, abi, signer) : null;

// Function to sign certificate details
export async function signCertificate(studentAddress, courseName, studentName, email, dateIssued) {
	if (!signer) {
		throw new Error('Signer not available');
	}

	// Hash the certificate details
	const certificateHash = ethers.utils.solidityKeccak256(
		['address', 'string', 'string', 'string', 'string'],
		[studentAddress, courseName, studentName, email, dateIssued]
	);

	// Sign the hash
	const signature = await signer.signMessage(ethers.utils.arrayify(certificateHash));

	return signature;
}

// Function to issue a certificate with a digital signature
export async function issueCertificate(studentAddress, courseName, studentName, email, dateIssued) {
	if (!contract) {
		throw new Error('Contract is not available');
	}

	try {
		// Generate the signature for the certificate
		const signature = await signCertificate(
			studentAddress,
			courseName,
			studentName,
			email,
			dateIssued
		);

		// Send the transaction to issue the certificate with the signature
		const tx = await contract.issueCertificate(
			studentAddress,
			courseName,
			studentName,
			email,
			dateIssued,
			signature, // Include the signature
			{ gasLimit: 100000000 } // Directly pass gasLimit as a number
		);
		await tx.wait();
		return 'Certificate issued successfully';
	} catch (err) {
		console.error('Error issuing certificate:', err);
		throw err; // Re-throw to handle on frontend
	}
}

// Function to get certificates by student address
export async function getCertificatesByAddress(address) {
	if (contract) {
		try {
			return await contract.getCertificatesByAddress(address);
		} catch (err) {
			console.error('Error fetching certificates:', err);
			throw err;
		}
	}
	throw new Error('Contract is not available');
}

export { provider, signer };
