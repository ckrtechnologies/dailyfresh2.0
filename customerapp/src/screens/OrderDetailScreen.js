import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar, 
  Image,
  Share,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, THEMES } from '../constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import { addItem } from '../store/slices/cartSlice';
import LogoLoader from '../components/LogoLoader';
import orderService from '../api/orderService';
import { showGlobalAlert } from '../services/alertService';
import { formatSafeDateTime } from '../utils/dateUtils';

const OrderDetailScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { order: initialOrder, orderId } = route.params || {};
  const resolvedOrderId = orderId || initialOrder?.id;
  console.log('[OrderDetail] Params:', JSON.stringify(route.params, null, 2));
  const [order, setOrder] = useState(initialOrder || (resolvedOrderId ? { id: resolvedOrderId } : null));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingNow, setPayingNow] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const { user } = useSelector(state => state.auth);
  
  // Theme resolution based on order delivery type
  const activeTheme = THEMES[order?.delivery_type || order?.deliveryType] || THEMES.all;

  const formatDateTime = (dateValue) => {
    return formatSafeDateTime(dateValue);
  };

  const formatStepDate = (dateValue) => {
    if (!dateValue) return '';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [resolvedOrderId]);

  const fetchOrderDetails = async (isRefresh = false) => {
    const id = resolvedOrderId || order?.id;
    if (!id) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await orderService.getOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data.order || res.data);
      }
    } catch (error) {
      console.error('[OrderDetail] Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchOrderDetails(true);
  };

  if (loading && !refreshing) return <LogoLoader fullScreen />;
  if (!order) return (
    <View style={styles.centerContainer}>
      <Icon name="package-variant-remove" size={80} color={COLORS.gray} />
      <Text style={styles.errorTitle}>Order Not Found</Text>
      <Text style={styles.errorSubtitle}>We couldn't find this order. It might have been moved or doesn't exist anymore.</Text>
      <TouchableOpacity 
        style={[styles.recoveryBtn, { backgroundColor: activeTheme.primary }]}
        onPress={() => navigation.navigate('AppTabs', { screen: 'Home' })}
      >
        <Text style={styles.recoveryBtnText}>Go Back Home</Text>
      </TouchableOpacity>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed': return '#FF9800'; // Orange
      case 'confirmed': return '#4CAF50'; // Green
      case 'preparing': return '#2196F3'; // Blue
      case 'ready': return '#3F51B5'; // Indigo
      case 'out_for_delivery':
      case 'picked_up': return '#9C27B0'; // Purple
      case 'delivered': return '#2E7D32'; // Dark Green
      case 'cancelled': return '#F44336'; // Red
      case 'failed': return '#757575'; // Gray
      default: return COLORS.gray;
    }
  };

  const getStatusText = (status) => {
    if (status === 'picked_up') return 'ON THE WAY';
    return status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
  };

  const StatusStep = ({ title, date, active, completed, last, cancelled }) => (
    <View style={styles.stepContainer}>
      <View style={styles.stepIndicator}>
        <View style={[
          styles.stepCircle, 
          (completed || active) && { backgroundColor: cancelled ? COLORS.error : activeTheme.primary, borderColor: cancelled ? COLORS.error : activeTheme.primary },
        ]}>
          {completed ? (
            <Icon name={cancelled ? "close" : "check"} size={14} color={COLORS.white} />
          ) : active ? (
            <View style={[styles.stepDot, { backgroundColor: COLORS.white }]} />
          ) : (
            <View style={styles.stepDot} />
          )}
        </View>
        {!last && <View style={[styles.stepLine, completed && { backgroundColor: cancelled ? COLORS.error : activeTheme.primary }]} />}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, active && { color: cancelled ? COLORS.error : activeTheme.primary, fontWeight: '700' }]}>
          {title}
        </Text>
        {!!date && <Text style={styles.stepDate}>{date}</Text>}
      </View>
    </View>
  );

  const getTaxInvoiceContent = () => {
    if (!order) return '';
    const invNo = `DF-INV-${order.order_number || order.orderNumber || order.id || 'N/A'}`;
    const invDate = formatSafeDateTime(order.created_at || order.createdAt);
    const totalAmt = Number(order.total_amount || order.totalAmount || 0).toFixed(2);
    const deliveryFee = Number(order.delivery_charge || order.deliveryCharge || 0).toFixed(2);
    const gstAmt = Number(order.gst_amount || order.gstAmount || 0);
    const cgst = (gstAmt / 2).toFixed(2);
    const sgst = (gstAmt / 2).toFixed(2);
    const subtotal = Number(order.total_items_price || order.totalItemsPrice || Math.max(0, totalAmt - deliveryFee - gstAmt)).toFixed(2);

    const customerName = user?.full_name || order.user?.full_name || order.shipping_address?.name || 'Valued Customer';
    const customerPhone = user?.phone || order.user?.phone || order.phone || order.shipping_address?.phone || 'N/A';
    
    let addrStr = 'Delivery Address on file';
    const addr = Array.isArray(order.delivery_address) ? order.delivery_address[0] : (order.delivery_address || order.deliveryAddress || order.address);
    if (addr && typeof addr === 'object') {
      const l1 = addr.line1 || addr.address_line1 || addr.address || '';
      const l2 = addr.line2 ? `, ${addr.line2}` : '';
      const cityPin = addr.city ? `, ${addr.city}${addr.pincode ? ' - ' + addr.pincode : ''}` : (addr.pincode ? ` - ${addr.pincode}` : '');
      addrStr = `${l1}${l2}${cityPin}`;
    } else if (typeof addr === 'string') {
      addrStr = addr;
    }

    const itemsList = (order.items || []).map((it, idx) => {
      const isFish = (it.name || '').toLowerCase().includes('fish') || (it.name || '').toLowerCase().includes('prawn') || (it.name || '').toLowerCase().includes('crab');
      const hsn = isFish ? '0302' : '0207';
      const rate = Number(it.unit_price || it.price || 0).toFixed(2);
      const amt = Number(it.total_price || (rate * it.quantity)).toFixed(2);
      const pref = it.preferences?.cut ? ` (${it.preferences.cut})` : '';
      return `${idx + 1}. ${it.name}${pref}\n   HSN: ${hsn} | Qty: ${it.quantity} | Rate: ₹${rate} | Total: ₹${amt}`;
    }).join('\n');

    return `================================================
TAX INVOICE / DISPUTE RESOLUTION MEMO
DAILY FRESH RETAIL PRIVATE LIMITED
14B Southern Avenue, Kolkata, WB - 700029
GSTIN: 19AAACD4567M1Z5 | FSSAI Lic No: 12823019000452
Customer Care: support@dailyfreshkolkata.in | +91 98300 12345
================================================
Invoice No    : ${invNo}
Invoice Date  : ${invDate}
Order Ref     : #${order.order_number || order.orderNumber || order.id}
Delivery Mode : ${String(order.delivery_type || order.deliveryType || 'Scheduled').toUpperCase()}
Payment Mode  : ${order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
Payment Status: ${isPaid ? 'PAID' : isCod ? 'PAYABLE ON DELIVERY' : 'PENDING'}
Txn Reference : ${order.razorpay_payment_id || order.razorpay_order_id || (isCod ? 'COD_VERIFIED' : 'N/A')}
------------------------------------------------
BILLED TO:
Customer : ${customerName}
Phone    : ${customerPhone}
Address  : ${addrStr}
Place of Supply: West Bengal (State Code: 19 - Intra-State)
------------------------------------------------
ITEMIZED PARTICULARS:
${itemsList}
------------------------------------------------
TAX & CHARGES BREAKDOWN:
Item Subtotal (Taxable Value): ₹${subtotal}
Central GST (CGST @ 2.5%)    : ₹${cgst}
State GST (SGST @ 2.5%)      : ₹${sgst}
Total Tax (GST 5%)           : ₹${gstAmt.toFixed(2)}
Delivery Charges (SAC 9968)  : ₹${deliveryFee}
------------------------------------------------
TOTAL INVOICE AMOUNT         : ₹${totalAmt}
================================================
TERMS & DISPUTE RESOLUTION:
1. This is a computer-generated Tax Invoice issued under Section 31 of CGST Act, 2017.
2. Goods once delivered are guaranteed for freshness. In case of any dispute regarding quality, shortage, or damage, share this invoice memo to support@dailyfreshkolkata.in or WhatsApp +91 98300 12345 within 24 hours for instant refund or replacement.
================================================`;
  };

  const handleShareInvoice = async () => {
    try {
      const invoiceText = getTaxInvoiceContent();
      await Share.share({
        title: `Tax Invoice #${order?.order_number || order?.orderNumber || order?.id}`,
        message: invoiceText,
      });
    } catch (error) {
      console.error('Invoice share error:', error);
    }
  };

  const handleShare = async () => {
    try {
      const itemsText = (order.items || []).map(it => `- ${it.name} (x${it.quantity})`).join('\n');
      await Share.share({
        message: `My Daily Fresh order #${order.order_number || order.id} is ${order.status}!\n\nItems:\n${itemsText}\n\nTotal: ₹${order.total_amount}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReorder = () => {
    try {
      order.items.forEach(item => {
        // Wrap in the structure cartSlice expects
        const payload = {
          product: {
            id: item.product_id,
            name: item.name,
            price: item.unit_price || item.price,
            image_url: item.product?.image_url,
            weight: item.weight || item.product?.weight,
          },
          quantity: item.quantity,
          variant: item.variant_id ? { id: item.variant_id, name: item.name } : null,
          cutPreference: item.preferences?.cut || null,
          cleaningPreference: item.preferences?.cleaning || null
        };
        dispatch(addItem(payload));
      });
      
      // Navigate to Cart
      navigation.navigate('AppTabs', { screen: 'Cart' });
    } catch (error) {
      console.error('Reorder error:', error);
    }
  };

  const isCod = (order?.payment_method || order?.paymentMethod) === 'cod';
  const pStatus = String(order?.payment_status || order?.paymentStatus || 'unpaid').toLowerCase();
  const isPaid = pStatus === 'paid' || pStatus === 'completed';

  const handlePayNow = async () => {
    if (payingNow || !order) return;
    setPayingNow(true);
    try {
      const rzpOrderId = order.razorpay_order_id || order.razorpayOrderId;
      const totalAmt = Number(order.total_amount || order.totalAmount || 0);
      const razorpayKey = 'rzp_test_ShPQJuXJZUJ1zT';

      const options = {
        description: `Order #${order.order_number || order.id} Payment`,
        image: 'https://dailyfreshkolkata.in/logo.jpg',
        currency: 'INR',
        key: razorpayKey,
        amount: Math.round(totalAmt * 100),
        name: 'Daily Fresh',
        order_id: rzpOrderId || undefined,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
          name: user?.full_name || ''
        },
        theme: { color: activeTheme.primary }
      };

      const paymentData = await RazorpayCheckout.open(options);

      const verifyRes = await orderService.verifyPayment({
        order_id: order.id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id || rzpOrderId,
        razorpay_signature: paymentData.razorpay_signature
      });

      if (verifyRes.success) {
        showGlobalAlert({
          title: 'Payment Successful',
          message: 'Your payment has been received and verified successfully!',
          type: 'success'
        });
        fetchOrderDetails(true);
      } else {
        showGlobalAlert({
          title: 'Verification Failed',
          message: "We couldn't verify your payment signature. If money was debited, please contact support.",
          type: 'error'
        });
      }
    } catch (err) {
      console.log('Pay now error / cancelled:', err);
      showGlobalAlert({
        title: 'Payment Incomplete',
        message: 'Payment was cancelled or could not be completed.',
        type: 'warning'
      });
    } finally {
      setPayingNow(false);
    }
  };

  const isCancelled = order.status === 'cancelled';
  const orderSteps = [
    { id: 'placed', title: 'Order Placed', statuses: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'] },
    { id: 'confirmed', title: 'Confirmed', statuses: ['confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'] },
    { id: 'preparing', title: 'Packing', statuses: ['preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'] },
    { id: 'ready', title: 'Ready', statuses: ['ready', 'picked_up', 'out_for_delivery', 'delivered'] },
    { id: 'out_for_delivery', title: 'On the Way', statuses: ['picked_up', 'out_for_delivery', 'delivered'], isActive: (s) => s === 'picked_up' || s === 'out_for_delivery' },
    { id: 'delivered', title: 'Delivered', statuses: ['delivered'] },
  ];

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: activeTheme.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={activeTheme.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: activeTheme.primary, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => setShowInvoiceModal(true)} style={styles.headerActionBtn}>
            <Icon name="file-document-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Icon name="refresh" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeTheme.primary]} />
          }
        >
        
        {/* Order Status Summary */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderIdText}>Order #{order.order_number || order.orderNumber || order.id || 'N/A'}</Text>
              <Text style={styles.storeText}>Daily Fresh Hub</Text>
              <Text style={styles.orderTimeText}>
                {formatDateTime(order.created_at || order.createdAt)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>
              <View style={[
                styles.paymentStatusBadge,
                {
                  backgroundColor: isPaid ? '#DCFCE7' : isCod ? '#F1F5F9' : '#FEF3C7',
                  borderColor: isPaid ? '#86EFAC' : isCod ? '#CBD5E1' : '#FCD34D'
                }
              ]}>
                <Icon 
                  name={isPaid ? "check-circle" : isCod ? "cash" : "clock-outline"} 
                  size={11} 
                  color={isPaid ? '#166534' : isCod ? '#475569' : '#B45309'} 
                />
                <Text style={[
                  styles.paymentStatusBadgeText,
                  { color: isPaid ? '#166534' : isCod ? '#475569' : '#B45309' }
                ]}>
                  {isPaid ? 'PAID' : isCod ? 'COD (PAY AT DELIVERY)' : 'PAYMENT PENDING'}
                </Text>
              </View>
            </View>
          </View>

          {/* OTP Section for Secure Delivery */}
          {(order.status === 'ready' || order.status === 'out_for_delivery') && !!order.delivery_otp && (
            <View style={[styles.otpCard, { backgroundColor: activeTheme.primary + '10', borderColor: activeTheme.primary + '30' }]}>
              <View style={styles.otpHeader}>
                <Icon name="shield-check" size={20} color={activeTheme.primary} />
                <Text style={[styles.otpTitle, { color: activeTheme.primary }]}>Delivery Verification OTP</Text>
              </View>
              <Text style={[styles.otpSub, { color: activeTheme.primary + 'cc' }]}>Share this with the rider only at the time of delivery.</Text>
              <View style={styles.otpContainer}>
                {String(order.delivery_otp || '----').split('').map((digit, i) => (
                  <View key={i} style={[styles.otpDigit, { borderColor: activeTheme.primary + '30' }]}>
                    <Text style={[styles.otpDigitText, { color: activeTheme.primary }]}>{digit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.trackingContainer}>
            {isCancelled ? (
              <StatusStep 
                title="Order Cancelled" 
                date={formatStepDate(order.updated_at || order.updatedAt || order.created_at || order.createdAt)} 
                active 
                completed 
                cancelled
                last
              />
            ) : (
              orderSteps.map((step, index) => (
                <StatusStep 
                  key={step.id}
                  title={step.title}
                  active={step.isActive ? step.isActive(order.status) : order.status === step.id}
                  completed={step.statuses.includes(order.status)}
                  last={index === orderSteps.length - 1}
                />
              ))
            )}
          </View>

          {/* Rider Details (Prominent version) */}
          {order.rider && (order.status === 'picked_up' || order.status === 'out_for_delivery') && (
            <View style={[styles.riderProminentCard, { backgroundColor: activeTheme.primary + '08', borderColor: activeTheme.primary + '20' }]}>
              <View style={[styles.riderAvatar, { borderColor: activeTheme.primary + '20' }]}>
                <Icon name="account" size={24} color={activeTheme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.riderName, { color: activeTheme.primary }]}>{order.rider.full_name}</Text>
                <Text style={styles.riderStatus}>
                  {order.status === 'delivered' ? 'Delivered your order' : 'Is delivering your order'}
                </Text>
              </View>
              {(order.status === 'picked_up' || order.status === 'out_for_delivery') && (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(`tel:${order.rider.phone}`)}
                    style={styles.riderActionBtn}
                  >
                    <Icon name="phone" size={20} color="#166534" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Items List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items ({order.items?.length || 0})</Text>
          {order.items?.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.itemRow, index === (order.items?.length || 0) - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: item.product?.image_url || item.product?.imageUrl || item.image_url || item.imageUrl || 'https://dailyfreshkolkata.online/assets/logo.png' }} 
                style={styles.itemImage} 
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                {/* Show variant name or customization if available, otherwise fallback to item name */}
                <Text style={styles.itemName}>
                  {item.variant?.name || (item.preferences?.cut ? `${item.preferences.cut}` : item.name)}
                </Text>
                <Text style={[styles.itemPref, { color: activeTheme.primary }]}>
                    {item.preferences.cut && item.preferences.cut !== (item.variant?.name || item.name) ? `${item.preferences.cut} Cut` : ''}
                    {item.preferences.cleaning && item.preferences.cleaning !== (item.variant?.name || item.name) ? (item.preferences.cut ? `, ${item.preferences.cleaning}` : item.preferences.cleaning) : ''}
                  </Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.total_price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Details */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={[styles.typeBadge, { backgroundColor: activeTheme.primary + '15' }]}>
              <Text style={[styles.typeText, { color: activeTheme.primary }]}>
                {String(order.delivery_type || order.deliveryType || 'Scheduled').replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Icon name="map-marker-outline" size={20} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              {/* Label if available */}
              {!!((Array.isArray(order.delivery_address) ? order.delivery_address[0]?.label : (order.delivery_address?.label || order.address?.label)) || order.address_label || order.shipping_address?.label) && (
                <Text style={[styles.addressLabel, { color: activeTheme.primary }]}>
                  {(Array.isArray(order.delivery_address) ? order.delivery_address[0]?.label : (order.delivery_address?.label || order.address?.label)) || order.address_label || order.shipping_address?.label}
                </Text>
              )}
              <Text style={styles.addressText}>
                {(() => {
                  const addr = Array.isArray(order.delivery_address) ? order.delivery_address[0] : (order.delivery_address || order.deliveryAddress || order.address);
                  if (addr && typeof addr === 'object') {
                    const l1 = addr.line1 || addr.address_line1 || addr.address || '';
                    const l2 = addr.line2 ? `\n${addr.line2}` : '';
                    const cityPin = addr.city ? `\n${addr.city}${addr.pincode ? ' - ' + addr.pincode : ''}` : (addr.pincode ? `\nPIN: ${addr.pincode}` : '');
                    if (l1 || cityPin) return `${l1}${l2}${cityPin}`;
                  }
                  if (order.shipping_address) {
                    const sa = order.shipping_address;
                    return `${sa.address || ''}${sa.city ? `\n${sa.city}` : ''}${sa.pincode ? ` - ${sa.pincode}` : ''}`;
                  }
                  return order.address_line1 || order.address || 'Address on record';
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Summary & Tax Invoice CTA */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s }}>
            <Text style={styles.sectionTitle}>Bill Summary</Text>
            <TouchableOpacity 
              onPress={() => setShowInvoiceModal(true)} 
              style={[styles.miniInvoiceTag, { borderColor: activeTheme.primary }]}
            >
              <Icon name="receipt" size={12} color={activeTheme.primary} />
              <Text style={[styles.miniInvoiceTagText, { color: activeTheme.primary }]}>Tax Invoice</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{order.total_items_price || order.totalItemsPrice || (Math.max(0, Number(order.total_amount || order.totalAmount || 0) - Number(order.delivery_charge || order.deliveryCharge || 0) - Number(order.gst_amount || order.gstAmount || 0))).toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{order.delivery_charge || order.deliveryCharge || 0}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes (GST 5%)</Text>
            <Text style={styles.billValue}>₹{order.gst_amount || order.gstAmount || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.billRow, styles.grandTotalRow]}>
            <Text style={styles.totalLabel}>
              {isPaid ? 'Total Amount Paid' : isCod ? 'Amount Payable on Delivery' : 'Total Amount to Pay'}
            </Text>
            <Text style={[styles.totalValue, { color: activeTheme.primary }]}>₹{order.total_amount || order.totalAmount || 0}</Text>
          </View>
          <View style={styles.paymentMethodRow}>
            <Icon 
              name={isPaid ? 'check-decagram' : isCod ? 'cash' : 'credit-card-clock-outline'} 
              size={16} 
              color={isPaid ? '#16A34A' : isCod ? COLORS.gray : '#D97706'} 
            />
            <Text style={[styles.paymentMethodText, !isPaid && !isCod && { color: '#D97706', fontWeight: '700' }]}>
              {isPaid 
                ? `Paid via ${isCod ? 'Cash on Delivery' : 'Online Payment'}`
                : isCod 
                  ? 'Cash on Delivery (Pay cash/UPI to rider upon delivery)'
                  : 'Online Payment (Pending / Not Yet Received)'}
            </Text>
          </View>

          {/* View & Share Tax Invoice Row */}
          <TouchableOpacity 
            style={[styles.taxInvoiceRowBtn, { borderColor: activeTheme.primary + '30', backgroundColor: activeTheme.primary + '08' }]}
            onPress={() => setShowInvoiceModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.taxInvoiceIconCircle, { backgroundColor: activeTheme.primary }]}>
                <Icon name="file-document-outline" size={18} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.taxInvoiceBtnTitle}>View & Share Tax Invoice</Text>
                <Text style={styles.taxInvoiceBtnSub}>GST Breakdown, FSSAI & Dispute Memo</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={activeTheme.primary} />
          </TouchableOpacity>
        </View>

        {/* Pay Now Button for Unpaid Online Orders */}
        {!isPaid && !isCod && order.status !== 'cancelled' && (
          <TouchableOpacity 
            style={[styles.payNowBtn, { backgroundColor: activeTheme.primary }]}
            onPress={handlePayNow}
            disabled={payingNow}
          >
            {payingNow ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Icon name="credit-card-outline" size={20} color={COLORS.white} />
                <Text style={styles.payNowBtnText}>
                  Pay Now ₹{order.total_amount || order.totalAmount || 0}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Reorder Button */}
        <TouchableOpacity 
          style={[styles.reorderBtn, { backgroundColor: activeTheme.primary }]}
          onPress={handleReorder}
        >
          <Icon name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.reorderBtnText}>Reorder Now</Text>
        </TouchableOpacity>

      </ScrollView>
      </View>

      {/* Finance-Grade Tax Invoice & Dispute Resolution Modal */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInvoiceModal(false)} style={styles.modalCloseBtn}>
              <Icon name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.modalHeaderTitle}>Tax Invoice & Audit Memo</Text>
              <Text style={styles.modalHeaderSub}>Section 31 CGST Act, 2017</Text>
            </View>
            <TouchableOpacity onPress={handleShareInvoice} style={styles.modalShareBtn}>
              <Icon name="share-variant" size={22} color={activeTheme.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.invoiceScroll} showsVerticalScrollIndicator={false}>
            {/* Invoice Sheet */}
            <View style={styles.invoiceSheet}>
              {/* Seller / Store Branding */}
              <View style={styles.invBrandSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="storefront" size={22} color={activeTheme.primary} />
                  <Text style={[styles.invStoreName, { color: activeTheme.primary }]}>DAILY FRESH RETAIL PVT. LTD.</Text>
                </View>
                <Text style={styles.invStoreAddress}>14B Southern Avenue, Kolkata, WB - 700029</Text>
                <View style={styles.invBadgeRow}>
                  <View style={styles.invTag}><Text style={styles.invTagText}>GSTIN: 19AAACD4567M1Z5</Text></View>
                  <View style={styles.invTag}><Text style={styles.invTagText}>FSSAI: 12823019000452</Text></View>
                </View>
                <Text style={styles.invContactText}>Care: support@dailyfreshkolkata.in | +91 98300 12345</Text>
              </View>

              <View style={styles.invDivider} />

              {/* Invoice Meta Grid */}
              <View style={styles.invMetaGrid}>
                <View style={styles.invMetaCol}>
                  <Text style={styles.invMetaLabel}>INVOICE NUMBER</Text>
                  <Text style={styles.invMetaValue}>DF-INV-{order.order_number || order.orderNumber || order.id}</Text>
                  <Text style={[styles.invMetaLabel, { marginTop: 8 }]}>DATE & TIME</Text>
                  <Text style={styles.invMetaValue}>{formatSafeDateTime(order.created_at || order.createdAt)}</Text>
                </View>
                <View style={styles.invMetaCol}>
                  <Text style={styles.invMetaLabel}>DELIVERY MODE</Text>
                  <Text style={styles.invMetaValue}>{String(order.delivery_type || order.deliveryType || 'Scheduled').toUpperCase()}</Text>
                  <Text style={[styles.invMetaLabel, { marginTop: 8 }]}>PAYMENT STATUS</Text>
                  <Text style={[styles.invMetaValue, { color: isPaid ? '#16A34A' : '#D97706', fontWeight: '700' }]}>
                    {isPaid ? 'PAID (ONLINE/COD)' : isCod ? 'PAYABLE ON DELIVERY' : 'PENDING'}
                  </Text>
                </View>
              </View>

              <View style={styles.invDivider} />

              {/* Customer / Billed To Section */}
              <View style={styles.invSection}>
                <Text style={styles.invSectionHeading}>BILLED TO / RECIPIENT DETAILS</Text>
                <Text style={styles.invCustName}>{user?.full_name || order.user?.full_name || order.shipping_address?.name || 'Customer'}</Text>
                <Text style={styles.invCustPhone}>Phone: {user?.phone || order.user?.phone || order.phone || order.shipping_address?.phone || 'N/A'}</Text>
                <Text style={styles.invCustAddr}>
                  Address: {(() => {
                    const addr = Array.isArray(order.delivery_address) ? order.delivery_address[0] : (order.delivery_address || order.deliveryAddress || order.address);
                    if (addr && typeof addr === 'object') {
                      const l1 = addr.line1 || addr.address_line1 || addr.address || '';
                      const l2 = addr.line2 ? `, ${addr.line2}` : '';
                      const cityPin = addr.city ? `, ${addr.city}${addr.pincode ? ' - ' + addr.pincode : ''}` : '';
                      return `${l1}${l2}${cityPin}`;
                    }
                    return 'Address on record';
                  })()}
                </Text>
                <Text style={styles.invPlaceSupply}>Place of Supply: West Bengal (Code: 19 - Intra-State)</Text>
              </View>

              <View style={styles.invDivider} />

              {/* Items Table */}
              <View style={styles.invSection}>
                <Text style={styles.invSectionHeading}>ITEMIZED PARTICULARS</Text>
                <View style={styles.invTableHeader}>
                  <Text style={[styles.invTh, { flex: 2.2 }]}>ITEM / CUT</Text>
                  <Text style={[styles.invTh, { flex: 1, textAlign: 'center' }]}>HSN</Text>
                  <Text style={[styles.invTh, { flex: 0.8, textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.invTh, { flex: 1.2, textAlign: 'right' }]}>TOTAL</Text>
                </View>
                {(order.items || []).map((it, idx) => {
                  const isFish = (it.name || '').toLowerCase().includes('fish') || (it.name || '').toLowerCase().includes('prawn');
                  const hsn = isFish ? '0302' : '0207';
                  return (
                    <View key={idx} style={styles.invTableRow}>
                      <View style={{ flex: 2.2 }}>
                        <Text style={styles.invItemName}>{it.name}</Text>
                        {!!it.preferences?.cut && (
                          <Text style={styles.invItemCut}>{it.preferences.cut} Cut</Text>
                        )}
                      </View>
                      <Text style={[styles.invTd, { flex: 1, textAlign: 'center' }]}>{hsn}</Text>
                      <Text style={[styles.invTd, { flex: 0.8, textAlign: 'center' }]}>{it.quantity}</Text>
                      <Text style={[styles.invTd, { flex: 1.2, textAlign: 'right', fontWeight: '700' }]}>₹{it.total_price}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.invDivider} />

              {/* Tax & Charges Breakdown */}
              <View style={styles.invSection}>
                <Text style={styles.invSectionHeading}>TAX & CHARGES BREAKDOWN (GST @ 5%)</Text>
                <View style={styles.invCalcRow}>
                  <Text style={styles.invCalcLabel}>Taxable Items Value</Text>
                  <Text style={styles.invCalcValue}>₹{order.total_items_price || order.totalItemsPrice || (Math.max(0, Number(order.total_amount || 0) - Number(order.delivery_charge || 0) - Number(order.gst_amount || 0))).toFixed(2)}</Text>
                </View>
                <View style={styles.invCalcRow}>
                  <Text style={styles.invCalcLabel}>Central GST (CGST @ 2.5%)</Text>
                  <Text style={styles.invCalcValue}>₹{((Number(order.gst_amount || order.gstAmount || 0)) / 2).toFixed(2)}</Text>
                </View>
                <View style={styles.invCalcRow}>
                  <Text style={styles.invCalcLabel}>State GST (SGST @ 2.5%)</Text>
                  <Text style={styles.invCalcValue}>₹{((Number(order.gst_amount || order.gstAmount || 0)) / 2).toFixed(2)}</Text>
                </View>
                <View style={styles.invCalcRow}>
                  <Text style={styles.invCalcLabel}>Delivery Fee (SAC 9968)</Text>
                  <Text style={styles.invCalcValue}>₹{order.delivery_charge || order.deliveryCharge || 0}</Text>
                </View>
                <View style={[styles.invCalcRow, styles.invTotalRow]}>
                  <Text style={styles.invTotalLabel}>GRAND TOTAL INVOICE</Text>
                  <Text style={[styles.invTotalValue, { color: activeTheme.primary }]}>₹{order.total_amount || order.totalAmount || 0}</Text>
                </View>
              </View>

              <View style={styles.invNoticeBox}>
                <Icon name="shield-check" size={18} color="#059669" />
                <Text style={styles.invNoticeText}>
                  Finance-Grade Certified: Valid for all tax filing and customer dispute claims within 24 hours of delivery.
                </Text>
              </View>
            </View>

            {/* Share CTA Button */}
            <TouchableOpacity 
              style={[styles.invShareBtn, { backgroundColor: activeTheme.primary }]}
              onPress={handleShareInvoice}
            >
              <Icon name="share-variant-outline" size={20} color={COLORS.white} />
              <Text style={styles.invShareBtnText}>Share Tax Invoice for Records / Dispute</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  helpBtn: {
    padding: SPACING.s,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xl * 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.l,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  storeText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  orderTimeText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  paymentStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trackingContainer: {
    marginLeft: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    height: 60,
  },
  stepIndicator: {
    alignItems: 'center',
    width: 30,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.white,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: -2,
  },
  stepContent: {
    marginLeft: 12,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  stepDate: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: SPACING.m,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.s,
    backgroundColor: '#F9FAFB',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  itemPref: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  itemQty: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 20,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  billValue: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  paymentMethodText: {
    fontSize: 11,
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 8,
    marginBottom: 12,
  },
  payNowBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  reorderBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24, // Island style
    gap: 8,
    marginBottom: 40,
  },
  reorderBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  otpCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  otpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3730A3',
  },
  otpSub: {
    fontSize: 11,
    color: '#4338CA',
    marginBottom: 12,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  otpDigit: {
    width: 44,
    height: 54,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    elevation: 2,
  },
  otpDigitText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  riderProminentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 12
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7'
  },
  riderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534'
  },
  riderStatus: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2
  },
  riderActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.white,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 20,
  },
  errorSubtitle: {
    textAlign: 'center',
    color: COLORS.gray,
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 20,
  },
  recoveryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: RADIUS.l,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  recoveryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  headerActionBtn: {
    padding: SPACING.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  miniInvoiceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  miniInvoiceTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taxInvoiceRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  taxInvoiceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxInvoiceBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  taxInvoiceBtnSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalShareBtn: {
    padding: 6,
  },
  invoiceScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  invoiceSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  invBrandSection: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  invStoreName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  invStoreAddress: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
  invBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  invTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  invContactText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  invDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  invMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invMetaCol: {
    flex: 1,
  },
  invMetaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  invMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  invSection: {
    marginBottom: 4,
  },
  invSectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  invCustName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  invCustPhone: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  invCustAddr: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  invPlaceSupply: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  invTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  invTh: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  invTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  invItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  invItemCut: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  invTd: {
    fontSize: 12,
    color: '#334155',
  },
  invCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  invCalcLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  invCalcValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  invTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 6,
    paddingTop: 8,
  },
  invTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  invTotalValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  invNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  invNoticeText: {
    flex: 1,
    fontSize: 10,
    color: '#065F46',
    lineHeight: 14,
  },
  invShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  invShareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
});

export default OrderDetailScreen;
