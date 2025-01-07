// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Certificate {
    struct CertificateInfo {
        string courseName;
        string studentName;
        string email;
        string dateIssued;
        bytes signature; // Store the digital signature
    }

    // Mapping from a student's address to a list of certificates
    mapping(address => CertificateInfo[]) private certificates;

    // Event for issuing certificates
    event CertificateIssued(address student, string courseName, string studentName, string email, string dateIssued, bytes signature);

    // Function to issue a certificate
    function issueCertificate(
        address student,
        string memory courseName,
        string memory studentName,
        string memory email,
        string memory dateIssued,
        bytes memory signature // Accept the digital signature as input
    ) public {
        // Store the certificate and its signature
        certificates[student].push(CertificateInfo(courseName, studentName, email, dateIssued, signature));
        emit CertificateIssued(student, courseName, studentName, email, dateIssued, signature);
    }

    // Function to get all certificates associated with a student
    function getCertificatesByAddress(address student) public view returns (CertificateInfo[] memory) {
        return certificates[student];
    }
}