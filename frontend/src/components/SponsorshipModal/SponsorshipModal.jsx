import React, { useEffect, useState } from 'react';
import { FaBullhorn, FaHandshake, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './SponsorshipModal.css';

const INITIAL_FORM = {
  brand: '',
  contact: '',
  email: '',
  budget: '',
  objective: '',
  message: '',
};

const SponsorshipModal = () => {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!open) return undefined;
    const onEsc = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setSent(true);
    setForm(INITIAL_FORM);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
    }, 1300);
  };

  return (
    <>
      <button
        type="button"
        className="spm-fab"
        onClick={() => setOpen(true)}
        aria-label="Abrir modal de patrocinio"
      >
        <FaBullhorn />
        <span>Patrocinar</span>
      </button>

      {open && (
        <div className="spm-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="spm-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="spm-close" onClick={() => setOpen(false)} aria-label="Cerrar">
              <FaTimes />
            </button>

            <header className="spm-head">
              <div className="spm-head__icon">
                <FaHandshake />
              </div>
              <div>
                <h3>Patrocinio Esportefy</h3>
                <p>Envia tu propuesta y te contactamos para activaciones, torneos y branding.</p>
              </div>
            </header>

            {sent ? (
              <div className="spm-success">
                <strong>Solicitud enviada</strong>
                <span>El equipo comercial revisara tu propuesta en breve.</span>
              </div>
            ) : (
              <form className="spm-form" onSubmit={onSubmit}>
                <label>
                  Marca o empresa
                  <input name="brand" value={form.brand} onChange={onChange} required />
                </label>
                <label>
                  Contacto
                  <input name="contact" value={form.contact} onChange={onChange} required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" value={form.email} onChange={onChange} required />
                </label>
                <label>
                  Presupuesto estimado
                  <select name="budget" value={form.budget} onChange={onChange} required>
                    <option value="">Seleccionar</option>
                    <option value="1k-5k">USD 1,000 - 5,000</option>
                    <option value="5k-20k">USD 5,000 - 20,000</option>
                    <option value="20k+">USD 20,000+</option>
                  </select>
                </label>
                <label>
                  Objetivo principal
                  <select name="objective" value={form.objective} onChange={onChange} required>
                    <option value="">Seleccionar</option>
                    <option value="branding">Branding y visibilidad</option>
                    <option value="torneo">Patrocinar torneos</option>
                    <option value="creadores">Campana con creadores</option>
                  </select>
                </label>
                <label>
                  Mensaje
                  <textarea
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={onChange}
                    placeholder="Cuentanos el tipo de activacion que buscas..."
                    required
                  />
                </label>

                <button type="submit" className="spm-submit">
                  <FaPaperPlane />
                  Enviar propuesta
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SponsorshipModal;
