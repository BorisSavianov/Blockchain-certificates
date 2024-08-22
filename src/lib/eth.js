import { ethers } from 'ethers';

// Check if window is defined (client-side)
const isBrowser = typeof window !== 'undefined';

let provider;
let signer;

// Initialize provider and signer if on the client-side
if (isBrowser) {
	if (window.ethereum) {
		provider = new ethers.providers.Web3Provider(window.ethereum);
		signer = provider.getSigner();
	} else {
		console.error('Ethereum provider not found. Please install MetaMask or another Web3 provider.');
	}
}

// Deployed contract address and ABI
const contractAddress = '0x340Da143F4C95d9c40cedD9A3a4f81050eDD0507'; // Replace with your contract address
const abi = [
	{
		inputs: [
			{ internalType: 'address', name: 'student', type: 'address' },
			{ internalType: 'string', name: 'courseName', type: 'string' },
			{ internalType: 'string', name: 'studentName', type: 'string' },
			{ internalType: 'string', name: 'email', type: 'string' },
			{ internalType: 'string', name: 'dateIssued', type: 'string' }
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
					{ internalType: 'string', name: 'dateIssued', type: 'string' }
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
			{ indexed: false, internalType: 'address', name: 'student', type: 'address' },
			{ indexed: false, internalType: 'string', name: 'courseName', type: 'string' },
			{ indexed: false, internalType: 'string', name: 'studentName', type: 'string' },
			{ indexed: false, internalType: 'string', name: 'email', type: 'string' },
			{ indexed: false, internalType: 'string', name: 'dateIssued', type: 'string' }
		],
		name: 'CertificateIssued',
		type: 'event'
	}
];

// Create contract instance only on client-side
export const contract =
	isBrowser && provider ? new ethers.Contract(contractAddress, abi, signer) : null;

export async function getCertificatesByAddress(address) {
	if (contract) {
		try {
			return await contract.getCertificatesByAddress(address);
		} catch (err) {
			console.error('Error fetching certificates:', err);
			throw err; // Re-throw to be caught in front-end code
		}
	}
	throw new Error('Contract is not available');
}

export { provider, signer };
