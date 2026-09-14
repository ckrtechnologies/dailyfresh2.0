import React, { useState } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Clock, 
  ChevronRight,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api';
import InvoiceModal from './InvoiceModal';

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  const queryClient = useQueryClient();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundAmount, setRefundAmount] = useState(order.total_amount || order.totalAmount || 0);
  const [refundReason, setRefundReason] = useState('Customer cancellation / Order return');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(null);
  const [refundError, setRefundError] = useState(null);

  const paymentStatus = (order.payment_status || order.paymentStatus || 'unpaid').toLowerCase();
  const paymentMethod = (order.payment_method || order.paymentMethod || 'cod').toUpperCase();
  const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed';
  const isRefunded = paymentStatus === 'refunded';
  const isCod = paymentMethod === 'COD';

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#10b981';
      case 'cancelled':
      case 'failed': return '#ef4444';
      case 'out_for_delivery':
      case 'picked_up': return '#8b5cf6';
      case 'ready': return '#3b82f6';
      default: return '#f59e0b';
    }
  };

  const handleProcessRefund = async () => {
    setRefundLoading(true);
    setRefundError(null);
    try {
      const resp = await apiClient.post(`/admin/orders/${order.id}/refund`, {
        amount: Number(refundAmount),
        reason: refundReason
      });

      setRefundSuccess(resp.data?.message || 'Refund processed successfully');
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['dashboard-stats']);
      
      // Update local state
      order.payment_status = 'refunded';
      order.paymentStatus = 'refunded';
      setTimeout(() => {
        setShowRefundConfirm(false);
      }, 1500);
    } catch (err) {
      console.error('Refund error:', err);
      setRefundError(err.response?.data?.message || err.message || 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      <div className="modal-content animate-slide-in-right" style={{
        background: 'white',
        width: '100%',
        maxWidth: '900px',
        height: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                Order #{order.order_number || order.orderNumber}
              </span>
              <span style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                backgroundColor: `${getStatusColor(order.status)}15`,
                color: getStatusColor(order.status)
              }}>
                {order.status?.replace(/_/g, ' ')}
              </span>
            </div>
            {(() => {
              const dVal = order.created_at || order.createdAt;
              if (!dVal) return null;
              const d = new Date(dVal);
              if (isNaN(d.getTime())) return null;
              return (
                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Clock size={13} color="#94a3b8" />
                  Placed: {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              );
            })()}
          </div>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            {/* Left Column: Logistics, Customer & Payment Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Delivery Window */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} /> Delivery Schedule
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Mode</div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      marginTop: '4px',
                      color: order.delivery_type === 'express' ? '#8b5cf6' : '#b91c1c'
                    }}>
                      {order.delivery_type === 'express' ? '⚡ EXPRESS' : '📅 SCHEDULED'}
                    </div>
                  </div>
                  {order.delivery_slot_label && (
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Time Window</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: '#1e293b' }}>
                        {order.delivery_slot_label}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} /> Customer Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>
                        {order.customer?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{order.customer?.full_name || 'Customer'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{order.customer?.email || 'N/A'}</div>
                    </div>
                  </div>
                  {order.customer?.phone && (
                    <a 
                      href={`tel:${order.customer.phone}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}
                    >
                      <Phone size={14} color="#3b82f6" /> {order.customer.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} /> Delivery Address
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {order.delivery_address?.line1 || order.address_line1 || 'Primary Store delivery address'} {order.delivery_address?.line2 || ''}<br />
                  {order.delivery_address?.city || ''} {order.delivery_address?.pincode ? ` - ${order.delivery_address.pincode}` : ''}
                </p>
                {order.delivery_address?.latitude && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_address.latitude},${order.delivery_address.longitude}`}
                    target="_blank" 
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', marginTop: '8px', textDecoration: 'none', fontWeight: '500' }}
                  >
                    Open in Maps <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {/* Payment & Refund Status Card */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={16} /> Payment & Billing
                  </h3>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    backgroundColor: isRefunded ? '#f3e8ff' : isPaid ? '#dcfce7' : isCod ? '#f1f5f9' : '#fee2e2',
                    color: isRefunded ? '#7e22ce' : isPaid ? '#15803d' : isCod ? '#475569' : '#b91c1c'
                  }}>
                    {isPaid ? 'PAID' : isCod ? 'COD (PAY AT DELIVERY)' : isRefunded ? 'REFUNDED' : 'UNPAID'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Payment Gateway:</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{paymentMethod}</span>
                </div>

                {isRefunded && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7e22ce', fontWeight: '600', background: '#faf5ff', padding: '8px', borderRadius: '6px' }}>
                    <CheckCircle2 size={14} /> Refund Processed for this order
                  </div>
                )}

                {isPaid && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => setShowRefundConfirm(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={13} /> Initiate Razorpay Refund
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Order Items & Rider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Order Items */}
              <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={16} /> Order Items ({order.items?.length || 0})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img 
                          src={item.product?.image_url || 'https://via.placeholder.com/40'} 
                          alt="" 
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.product?.name || item.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Qty: {item.quantity} × ₹{item.unit_price || item.price}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>₹{item.total_price}</div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>Total Items</span>
                    <span>₹{order.total_items_price || (order.total_amount - (order.delivery_charge || 0) - (order.gst_amount || 0))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                    <span>Delivery Fee</span>
                    <span>₹{order.delivery_charge || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' }}>
                    <span>Total Order Amount</span>
                    <span style={{ color: 'var(--primary)', fontSize: '18px' }}>₹{order.total_amount}</span>
                  </div>
                </div>
              </div>

              {/* Rider Section */}
              {order.rider ? (
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f0fdf4', backgroundColor: '#f0fdf4' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} /> Assigned Rider
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>{order.rider.full_name}</div>
                      <a 
                        href={`tel:${order.rider.phone}`}
                        style={{ fontSize: '12px', color: '#166534', textDecoration: 'none', fontWeight: '600' }}
                      >
                        {order.rider.phone}
                      </a>
                    </div>
                    <a 
                      href={`tel:${order.rider.phone}`}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        backgroundColor: 'white', 
                        border: '1px solid #bcf0da',
                        color: '#166534',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        textDecoration: 'none'
                      }}
                    >
                      Call Rider
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fef3c7', backgroundColor: '#fffbeb', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>Waiting for Rider Assignment</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {isPaid && (
              <button
                onClick={() => setShowRefundConfirm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} /> Refund Order
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                background: 'white',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button 
              onClick={() => setShowInvoiceModal(true)}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '8px', 
                border: 'none', 
                background: '#047857',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Tax Invoice (Print / Dispute)
            </button>
          </div>
        </div>

        {/* Official Tax Invoice Modal */}
        {showInvoiceModal && (
          <InvoiceModal order={order} onClose={() => setShowInvoiceModal(false)} />
        )}

        {/* Refund Confirmation Modal Overlay */}
        {showRefundConfirm && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1050
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} color="#dc2626" /> Process Order Refund
                </h3>
                <button 
                  onClick={() => setShowRefundConfirm(false)} 
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={18} />
                </button>
              </div>

              {refundError && (
                <div style={{ padding: '10px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '12px', marginBottom: '14px' }}>
                  {refundError}
                </div>
              )}

              {refundSuccess ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#166534', background: '#f0fdf4', borderRadius: '8px' }}>
                  <CheckCircle2 size={28} color="#16a34a" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{refundSuccess}</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    This will initiate a refund via Razorpay for Order <b>#{order.order_number}</b>.
                  </p>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      Refund Amount (₹)
                    </label>
                    <input 
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={order.total_amount}
                      min={1}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      Reason for Refund
                    </label>
                    <textarea 
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        resize: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      onClick={() => setShowRefundConfirm(false)}
                      disabled={refundLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: 'white',
                        color: '#64748b',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProcessRefund}
                      disabled={refundLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#dc2626',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {refundLoading ? 'Processing...' : 'Confirm Refund'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;
