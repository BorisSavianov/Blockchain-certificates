// hardhat.config.cjs
require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

module.exports = {
	solidity: '0.8.24',
	networks: {
		localhost: {
			url: 'http://127.0.0.1:8545',
			gas: 5000000,
			gasPrice: 20000000000
		}
	}
};
