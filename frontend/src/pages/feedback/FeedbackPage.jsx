import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const stars = (n) =>
  '⭐'.repeat(Math.max(0, n)) +
  '☆'.repeat(Math.max(0, 5 - n));

const F = ({ label, children }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
  </div>
);

function canEditOrDelete(feedback, userId) {
  if (!feedback.createdAt) return false;

  const created = new Date(feedback.createdAt).getTime();
  const now = Date.now();
  const within24h =
    (now - created) < 24 * 60 * 60 * 1000;

  return within24h;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  // null | 'create' | 'edit' | 'delete' | 'remove'

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    rating: 5,
    feedbackText: '',
    orderId: ''
  });

  const [editForm, setEditForm] = useState({
    rating: 5,
    feedbackText: ''
  });

  const [removeReason, setRemoveReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const isManager = [
    'ADMIN',
    'BRANCH_MANAGER_ADMIN',
    'BRANCH_MANAGER'
  ].includes(user?.role);

  const isCustomer = user?.role === 'CUSTOMER';

  const load = () => {
    setLoading(true);

    const endpoint = isCustomer
      ? '/feedback/my'
      : '/feedback';

    api.get(endpoint, { params: { size: 50 } })
      .then(r => setFeedback(r.data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [isCustomer]);

  const openCreate = () => {
    setForm({
      rating: 5,
      feedbackText: '',
      orderId: ''
    });

    setError('');
    setModal('create');
  };

  const openEdit = (f) => {
    setSelected(f);

    setEditForm({
      rating: f.rating,
      feedbackText: f.feedbackText || ''
    });

    setError('');
    setModal('edit');
  };

  const openDelete = (f) => {
    setSelected(f);
    setError('');
    setModal('delete');
  };

  const openRemove = (f) => {
    setSelected(f);
    setRemoveReason('');
    setError('');
    setModal('remove');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();

    setSaving(true);
    setError('');

    // Validate review
    if (!form.feedbackText.trim()) {
      setError('Please enter your review.');
      setSaving(false);
      return;
    }

    // Validate Order ID
    if (!form.orderId) {
      setError('Order ID is required.');
      setSaving(false);
      return;
    }

    const parsedOrderId = parseInt(form.orderId, 10);

    if (
      isNaN(parsedOrderId) ||
      parsedOrderId <= 0
    ) {
      setError('Please enter a valid Order ID.');
      setSaving(false);
      return;
    }

    try {
      await api.post('/feedback', {
        rating: Number(form.rating),
        feedbackText: form.feedbackText.trim(),
        orderId: parsedOrderId
      });

      closeModal();
      load();

    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Failed to submit feedback'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (ev) => {
    ev.preventDefault();

    setSaving(true);
    setError('');

    if (!editForm.feedbackText.trim()) {
      setError('Please enter your review.');
      setSaving(false);
      return;
    }

    try {
      await api.put(`/feedback/${selected.id}`, {
        rating: Number(editForm.rating),
        feedbackText: editForm.feedbackText.trim()
      });

      closeModal();
      load();

    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Failed to update feedback'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');

    try {
      await api.delete(`/feedback/${selected.id}`);

      closeModal();
      load();

    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Failed to delete feedback'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleManagerRemove = async () => {
    if (!removeReason.trim()) {
      setError(
        'A reason must be provided before removing feedback.'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.delete(`/feedback/${selected.id}`);

      closeModal();
      load();

    } catch (e) {
      setError(
        e.response?.data?.message ||
        'Failed to remove feedback'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>

      <div className="page-header">

        <div className="page-header-left">

          <h1>
            {isCustomer
              ? 'My Feedback'
              : 'Customer Feedback'}
          </h1>

          <p>
            {isCustomer
              ? 'Share your experience, view, update, or delete your reviews.'
              : 'Manage reviews from customers'}
          </p>

        </div>

        {isCustomer && (
          <button
            className="btn btn-primary"
            onClick={openCreate}
          >
            ➕ Leave Feedback
          </button>
        )}

      </div>


      {loading ? (

        <div className="loading">
          <div className="spinner" />
        </div>

      ) : (

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}
        >

          {feedback.map(f => {

            return (

              <div
                key={f.id}
                className="card"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >

                <div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8
                    }}
                  >

                    <div>

                      <p
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {f.customerName}
                      </p>

                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        {f.createdAt
                          ? new Date(
                              f.createdAt
                            ).toLocaleString()
                          : ''}
                      </p>

                    </div>


                    <div style={{ textAlign: 'right' }}>

                      <span
                        style={{
                          fontSize: '1.1rem'
                        }}
                      >
                        {stars(f.rating)}
                      </span>

                      {f.orderId && (
                        <p
                          style={{
                            fontSize: '0.7rem',
                            color:
                              'var(--color-text-muted)',
                            marginTop: 2
                          }}
                        >
                          Order #{f.orderId}
                        </p>
                      )}

                    </div>

                  </div>


                  {f.feedbackText && (
                    <p
                      style={{
                        color:
                          'var(--color-text-secondary)',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        marginBottom: 12
                      }}
                    >
                      "{f.feedbackText}"
                    </p>
                  )}

                </div>


                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 8
                  }}
                >

                  {isCustomer && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem'
                        }}
                        onClick={() =>
                          openEdit(f)
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="btn btn-danger"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem'
                        }}
                        onClick={() =>
                          openDelete(f)
                        }
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}


                  {isManager && (
                    <button
                      className="btn btn-danger"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem'
                      }}
                      onClick={() =>
                        openRemove(f)
                      }
                    >
                      🚫 Remove
                    </button>
                  )}

                </div>

              </div>

            );
          })}


          {!feedback.length && (
            <div
              className="empty-state"
              style={{
                gridColumn: '1/-1'
              }}
            >
              <div className="empty-state-icon">
                ⭐
              </div>

              <h3>No feedback yet</h3>
            </div>
          )}

        </div>
      )}


      {/* CREATE FEEDBACK MODAL */}

      {modal === 'create' && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="modal"
            onClick={e => e.stopPropagation()}
          >

            <div className="modal-header">

              <h3 className="modal-title">
                ⭐ Submit Feedback
              </h3>

              <button
                className="btn btn-icon"
                onClick={closeModal}
              >
                ✕
              </button>

            </div>


            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}


            <form onSubmit={handleCreate}>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >

                <F label="Rating">

                  <select
                    className="form-input"
                    value={form.rating}
                    onChange={e =>
                      setForm({
                        ...form,
                        rating: e.target.value
                      })
                    }
                  >

                    {[5, 4, 3, 2, 1].map(r => (

                      <option
                        key={r}
                        value={r}
                      >
                        {stars(r)} ({r} star
                        {r > 1 ? 's' : ''})
                      </option>

                    ))}

                  </select>

                </F>


                <F label="Your Review">

                  <textarea
                    className="form-input"
                    rows={4}
                    required
                    placeholder="Share your experience..."
                    value={form.feedbackText}
                    onChange={e =>
                      setForm({
                        ...form,
                        feedbackText: e.target.value
                      })
                    }
                  />

                </F>


                {/* ORDER ID IS NOW REQUIRED */}

                <F label="Order ID">

                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    required
                    placeholder="#12345"
                    value={form.orderId}
                    onChange={e =>
                      setForm({
                        ...form,
                        orderId: e.target.value
                      })
                    }
                  />

                </F>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? '⏳ Submitting...'
                    : 'Submit Feedback'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* EDIT FEEDBACK MODAL */}

      {modal === 'edit' && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="modal"
            onClick={e => e.stopPropagation()}
          >

            <div className="modal-header">

              <h3 className="modal-title">
                ✏️ Edit Feedback
              </h3>

              <button
                className="btn btn-icon"
                onClick={closeModal}
              >
                ✕
              </button>

            </div>


            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}


            <form onSubmit={handleEdit}>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >

                <F label="Rating">

                  <select
                    className="form-input"
                    value={editForm.rating}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        rating: e.target.value
                      })
                    }
                  >

                    {[5, 4, 3, 2, 1].map(r => (

                      <option
                        key={r}
                        value={r}
                      >
                        {stars(r)} ({r} star
                        {r > 1 ? 's' : ''})
                      </option>

                    ))}

                  </select>

                </F>


                <F label="Review">

                  <textarea
                    className="form-input"
                    rows={4}
                    required
                    value={editForm.feedbackText}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        feedbackText: e.target.value
                      })
                    }
                  />

                </F>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? '⏳ Saving...'
                    : 'Save Changes'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* DELETE FEEDBACK MODAL */}

      {modal === 'delete' && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="modal"
            style={{ maxWidth: 440 }}
            onClick={e => e.stopPropagation()}
          >

            <div className="modal-header">

              <h3 className="modal-title">
                🗑️ Delete Feedback
              </h3>

              <button
                className="btn btn-icon"
                onClick={closeModal}
              >
                ✕
              </button>

            </div>


            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}


            <p
              style={{
                padding: '0 4px 16px',
                color: 'var(--color-text-secondary)'
              }}
            >
              Are you sure you want to delete your
              feedback? This action cannot be undone.
            </p>


            <div className="modal-footer">

              <button
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                disabled={saving}
                onClick={handleDelete}
              >
                {saving
                  ? '⏳ Deleting...'
                  : 'Delete Feedback'}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* MANAGER REMOVE MODAL */}

      {modal === 'remove' && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="modal"
            style={{ maxWidth: 480 }}
            onClick={e => e.stopPropagation()}
          >

            <div className="modal-header">

              <h3 className="modal-title">
                🚫 Remove Feedback
              </h3>

              <button
                className="btn btn-icon"
                onClick={closeModal}
              >
                ✕
              </button>

            </div>


            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}


            <div style={{ padding: '0 4px 12px' }}>

              <p
                style={{
                  color:
                    'var(--color-text-secondary)',
                  marginBottom: 12,
                  fontSize: '0.875rem'
                }}
              >
                You are removing feedback from{' '}
                <strong>
                  {selected?.customerName}
                </strong>
                . An audit record will be created.
              </p>


              <F label="Reason for Removal (Required)">

                <textarea
                  className="form-input"
                  rows={3}
                  required
                  placeholder="e.g. Abusive language, spam content..."
                  value={removeReason}
                  onChange={e =>
                    setRemoveReason(e.target.value)
                  }
                />

              </F>

            </div>


            <div className="modal-footer">

              <button
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                disabled={saving}
                onClick={handleManagerRemove}
              >
                {saving
                  ? '⏳ Removing...'
                  : 'Remove & Log'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
