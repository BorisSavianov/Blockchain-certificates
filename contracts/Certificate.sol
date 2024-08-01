// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Certificate {
    struct CertificateInfo {
        string courseName;
        string studentName;
        string dateIssued;
    }

    mapping(address => CertificateInfo) private certificates;

    // Event for issuing certificates
    event CertificateIssued(address student, string courseName, string studentName, string dateIssued);

    function issueCertificate(
        address student,
        string memory courseName,
        string memory studentName,
        string memory dateIssued
    ) public {
        certificates[student] = CertificateInfo(courseName, studentName, dateIssued);
        emit CertificateIssued(student, courseName, studentName, dateIssued);
    }

    function verifyCertificate(address student)
        public
        view
        returns (CertificateInfo memory)
    {
        CertificateInfo memory certificate = certificates[student];
        require(bytes(certificate.courseName).length > 0, "No certificate found for this address");
        return certificate;
    }
}
