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
const contractAddress = '0x5225Fe0F81d33490C01a476A30FD4be86f28493b'; // Replace with your contract address
const abi = [
	'function issueCertificate(address student, string memory courseName, string memory studentName, string memory dateIssued) public',
	'function verifyCertificate(address student) public view returns (tuple(string courseName, string studentName, string dateIssued))'
];

// Create contract instance only on client-side
export const contract =
	isBrowser && provider ? new ethers.Contract(contractAddress, abi, signer) : null;
export { provider, signer };
