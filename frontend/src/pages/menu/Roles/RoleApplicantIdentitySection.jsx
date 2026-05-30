import { useLang } from '../../../context/LanguageContext';

const RoleApplicantIdentitySection = ({
    formData,
    onInputChange,
    onFileChange,
    fileName,
    documentInputId,
    errors = {},
    prefilledFullName = false
}) => {
    const { t } = useLang();
    return (
        <>
            <h4 className="section-title">{t('roleApplyApplicantData')}</h4>
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
                    <label>{t('roleApplyFullName')}</label>
                    <i className='bx bx-user input-icon'></i>
                    {errors.fullName && <small className="field-error">{errors.fullName}</small>}
                    {prefilledFullName && !errors.fullName && <span className="prefilled-hint"><i className='bx bx-check-circle'></i>Completado desde tu perfil</span>}
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
                    <label>{t('roleApplyIdNumber')}</label>
                    <i className='bx bx-id-card input-icon'></i>
                    {errors.idNumber && <small className="field-error">{errors.idNumber}</small>}
                </div>
            </div>

            <div className="input-group file-upload-group">
                <label className="static-label">{t('roleApplyIdPhoto')}</label>
                <div className="file-box">
                    <input
                        type="file"
                        id={documentInputId}
                        className="hidden-input"
                        accept="image/*,.pdf"
                        onChange={onFileChange}
                    />
                    <label htmlFor={documentInputId} className={`upload-btn${errors.document ? ' input-error' : ''}`}>
                        <i className='bx bx-cloud-upload'></i> {t('uploadBtn')}
                    </label>
                    <span className="file-name">{fileName}</span>
                </div>
                <small>{t('roleApplyIdFormats')}</small>
                {errors.document && <small className="field-error">{errors.document}</small>}
            </div>
        </>
    );
};

export default RoleApplicantIdentitySection;
