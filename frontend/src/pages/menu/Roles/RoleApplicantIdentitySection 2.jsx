import React from 'react';

const RoleApplicantIdentitySection = ({
    formData,
    onInputChange,
    onFileChange,
    fileName,
    documentInputId
}) => {
    return (
        <>
            <h4 className="section-title">Datos del Solicitante</h4>
            <div className="grid-inputs">
                <div className="input-group">
                    <input type="text" name="fullName" required placeholder=" " value={formData.fullName} onChange={onInputChange} />
                    <label>Nombre Legal Completo</label>
                    <i className='bx bx-user input-icon'></i>
                </div>
                <div className="input-group">
                    <input type="text" name="idNumber" required placeholder=" " value={formData.idNumber} onChange={onInputChange} />
                    <label>Cedula / DNI / Pasaporte / ID</label>
                    <i className='bx bx-id-card input-icon'></i>
                </div>
            </div>

            <div className="input-group file-upload-group">
                <label className="static-label">Foto de Cedula / Documento de Identidad</label>
                <div className="file-box">
                    <input
                        type="file"
                        id={documentInputId}
                        className="hidden-input"
                        accept="image/*,.pdf"
                        onChange={onFileChange}
                    />
                    <label htmlFor={documentInputId} className="upload-btn">
                        <i className='bx bx-cloud-upload'></i> Subir Archivo
                    </label>
                    <span className="file-name">{fileName}</span>
                </div>
                <small>Formatos: PDF, JPG, PNG, WEBP. Max 5MB.</small>
            </div>
        </>
    );
};

export default RoleApplicantIdentitySection;
