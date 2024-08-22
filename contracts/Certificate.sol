// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Certificate {
    struct CertificateInfo {
        string courseName;
        string studentName;
        string email;
        string dateIssued;
    }

    // Mapping from a student's address to a list of certificates
    mapping(address => CertificateInfo[]) private certificates;

    // Event for issuing certificates
    event CertificateIssued(address student, string courseName, string studentName, string email, string dateIssued);

    function issueCertificate(
        address student,
        string memory courseName,
        string memory studentName,
        string memory email,
        string memory dateIssued
    ) public {
        // Store the certificate in the array
        certificates[student].push(CertificateInfo(courseName, studentName, email, dateIssued));
        emit CertificateIssued(student, courseName, studentName, email, dateIssued);
    }

    // Function to get all certificates associated with a student
    function getCertificatesByAddress(address student)
        public
        view
        returns (CertificateInfo[] memory)
    {
        // Return certificates for the address
        return certificates[student];
    }
}
