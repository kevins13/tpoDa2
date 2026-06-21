import { Notification } from '../context/NotificationContext';

// Helper para crear notificaciones de documentos
export const createDocumentNotification = (
  approved: boolean,
  documentName: string,
  reason?: string
): Omit<Notification, 'id' | 'timestamp' | 'read'> => {
  if (approved) {
    return {
      type: 'document_approved',
      title: 'Documento Aprobado',
      message: `Tu documento "${documentName}" ha sido aprobado exitosamente. Ya puedes continuar con tu registro.`
    };
  } else {
    return {
      type: 'document_rejected',
      title: 'Documento Rechazado',
      message: `Tu documento "${documentName}" ha sido rechazado. ${reason || 'Por favor, verifica la información y vuelve a subirlo.'}`
    };
  }
};

// Helper para crear notificaciones de productos a vender
export const createProductNotification = (
  approved: boolean,
  productName: string,
  reason?: string,
  auctionId?: string
): Omit<Notification, 'id' | 'timestamp' | 'read'> => {
  if (approved) {
    return {
      type: 'product_approved',
      title: 'Producto Aprobado para Subasta',
      message: `Tu producto "${productName}" ha sido aprobado y será incluido en una próxima subasta. Te notificaremos cuando esté disponible.`,
      auctionId
    };
  } else {
    return {
      type: 'product_rejected',
      title: 'Producto Rechazado',
      message: `Tu producto "${productName}" no ha sido aprobado para subasta. ${reason || 'Por favor, revisa las políticas de publicación.'}`
    };
  }
};

// Helper para crear notificaciones de medios de pago
export const createPaymentMethodNotification = (
  approved: boolean,
  paymentType: string,
  reason?: string
): Omit<Notification, 'id' | 'timestamp' | 'read'> => {
  if (approved) {
    return {
      type: 'payment_approved',
      title: 'Medio de Pago Aprobado',
      message: `Tu medio de pago "${paymentType}" ha sido verificado y aprobado exitosamente. Ya puedes usarlo para tus transacciones.`
    };
  } else {
    return {
      type: 'payment_rejected',
      title: 'Medio de Pago Rechazado',
      message: `Tu medio de pago "${paymentType}" no pudo ser verificado. ${reason || 'Por favor, verifica los datos ingresados.'}`
    };
  }
};

// Helper para crear notificación de subasta en vivo
export const createAuctionLiveNotification = (
  auctionTitle: string,
  auctionId: string
): Omit<Notification, 'id' | 'timestamp' | 'read'> => {
  return {
    type: 'auction_live',
    title: '¡Subasta en Vivo!',
    message: `La subasta "${auctionTitle}" acaba de comenzar. ¡Participa ahora!`,
    auctionId
  };
};

// Helper para crear notificación de ser superado en una puja
export const createOutbidNotification = (
  itemTitle: string,
  newBidAmount: number,
  auctionId: string
): Omit<Notification, 'id' | 'timestamp' | 'read'> => {
  return {
    type: 'outbid',
    title: 'Te han superado en la subasta',
    message: `Otro usuario ha hecho una puja de $${newBidAmount.toLocaleString()} en "${itemTitle}". ¡Puja nuevamente para recuperar la delantera!`,
    auctionId
  };
};

// Helper para crear notificación de oferta recibida
export const createOfferReceivedNotification = (
  itemTitle: string,
  basePrice: number,
  commission: number,
  saleItemId: string
): Omit<Notification, 'id' | 'timestamp' | 'read'> => {
  return {
    type: 'offer_received',
    title: '¡Has recibido una oferta!',
    message: `Tu artículo "${itemTitle}" ha sido evaluado. Precio base: $${basePrice.toLocaleString()}, Comisión: $${commission.toLocaleString()}. Revisa y responde la oferta en "Mis Ventas".`,
    saleItemId
  };
};

// Ejemplos de uso:
// 
// En el componente de registro después de subir documentos:
// addNotification(createDocumentNotification(true, "DNI Frente y Dorso"));
//
// En el componente de vender item después de la revisión:
// addNotification(createProductNotification(true, "Reloj Rolex Submariner", undefined, "123"));
//
// En el componente de medios de pago después de la verificación:
// addNotification(createPaymentMethodNotification(false, "Tarjeta Visa ****1234", "Los datos no coinciden con el titular."));
//
// Cuando una subasta comienza:
// addNotification(createAuctionLiveNotification("Subasta de Joyas Antiguas", "456"));
//
// Cuando otro usuario supera tu puja:
// addNotification(createOutbidNotification("Anillo de Diamantes", 48500, "789"));
