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
const contractAddress = '0x39bd249860e83fe1269b5b76abeb23a5fbf4d115'; // Replace with your contract address
const abi = [
	{
		inputs: [
			{
				internalType: 'address',
				name: 'student',
				type: 'address'
			},
			{
				internalType: 'string',
				name: 'courseName',
				type: 'string'
			},
			{
				internalType: 'string',
				name: 'studentName',
				type: 'string'
			},
			{
				internalType: 'string',
				name: 'email',
				type: 'string'
			},
			{
				internalType: 'string',
				name: 'dateIssued',
				type: 'string'
			}
		],
		name: 'issueCertificate',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: 'student',
				type: 'address'
			}
		],
		name: 'verifyCertificate',
		outputs: [
			{
				components: [
					{
						internalType: 'string',
						name: 'courseName',
						type: 'string'
					},
					{
						internalType: 'string',
						name: 'studentName',
						type: 'string'
					},
					{
						internalType: 'string',
						name: 'email',
						type: 'string'
					},
					{
						internalType: 'string',
						name: 'dateIssued',
						type: 'string'
					}
				],
				internalType: 'struct Certificate.CertificateInfo',
				name: '',
				type: 'tuple'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'address',
				name: 'student',
				type: 'address'
			},
			{
				indexed: false,
				internalType: 'string',
				name: 'courseName',
				type: 'string'
			},
			{
				indexed: false,
				internalType: 'string',
				name: 'studentName',
				type: 'string'
			},
			{
				indexed: false,
				internalType: 'string',
				name: 'email',
				type: 'string'
			},
			{
				indexed: false,
				internalType: 'string',
				name: 'dateIssued',
				type: 'string'
			}
		],
		name: 'CertificateIssued',
		type: 'event'
	}
];

// Create contract instance only on client-side
export const contract =
	isBrowser && provider ? new ethers.Contract(contractAddress, abi, signer) : null;
export { provider, signer };
