const RoleApplicantIdentitySection = ({
    formData,
    onInputChange,
    onFileChange,
    fileName,
    documentInputId,
    errors = {}
}) => {
    return (
        <>
            <h4 className="section-title">Datos del Solicitante</h4>
            <div className="grid-inputs">
                <div className="input-group">
                    <input
                        type="text"
                        name="fullName"
                        placeholder=" "
                        value={formData.fullName}
                        onChange={onInputChange}
                        className={errors.fullName ? 'input-error' : ''}
                    />
                    <label>Nombre Legal Completo</label>
                    <i className='bx bx-user input-icon'></i>
                    {errors.fullName && <small className="field-error">{errors.fullName}</small>}
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        name="idNumber"
                        placeholder=" "
                        value={formData.idNumber}
                        onChange={onInputChange}
                        className={errors.idNumber ? 'input-error' : ''}
                    />
                    <label>Cédula / DNI / Pasaporte / ID</label>
                    <i className='bx bx-id-card input-icon'></i>
                    {errors.idNumber && <small className="field-error">{errors.idNumber}</small>}
                </div>
            </div>

            <div className="input-group file-upload-group">
                <label className="static-label">Foto de Cédula / Documento de Identidad</label>
                <div className="file-box">
                    <input
                        type="file"
                        id={documentInputId}
                        className="hidden-input"
                        accept="image/*,.pdf"
                        onChange={onFileChange}
                    />
                    <label htmlFor={documentInputId} className={`upload-btn${errors.document ? ' input-error' : ''}`}>
                        <i className='bx bx-cloud-upload'></i> Subir Archivo
                    </label>
                    <span className="file-name">{fileName}</span>
                </div>
                <small>Formatos: PDF, JPG, PNG, WEBP. Máx 5MB.</small>
                {errors.document && <small className="field-error">{errors.document}</small>}
            </div>
        </>
    );
};

export default RoleApplicantIdentitySection;
