//backend/controllers/pagoController.js

const { client } = require('../config/paypal');
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const { executeStoredProcedure } = require('../config/database');


//Pagar con tarjeta de crédito o débito (simulación)
const pagarConTarjeta = async (req, res) => {
  const { folio_cita, nombre, numero, vencimiento, cvv } = req.body;

  if (!folio_cita || !nombre || !numero || !vencimiento || !cvv) {
    return res.status(400).json({ success: false, message: 'Faltan datos de la tarjeta o cita.' });
  }

  try {
    // Simulamos el registro del pago
    await executeStoredProcedure('sp_registrarPagoTarjeta', {
      folio_cita,
      nombre,
      numero,
      vencimiento,
      cvv
    });

    res.json({ success: true, message: 'Pago simulado con éxito' });
  } catch (error) {
    console.error('❌ Error al simular pago con tarjeta:', error);
    res.status(500).json({ success: false, message: 'Error en el pago simulado' });
  }
};


// Crear orden de pago en PayPal
const crearOrdenPaypal = async (req, res) => {
  const { cantidad } = req.body;

  if (!cantidad || isNaN(cantidad)) {
    return res.status(400).json({ success: false, message: 'Monto inválido o no proporcionado.' });
  }

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer("return=representation");
 request.requestBody({
  intent: "CAPTURE",
  purchase_units: [{
    amount: {
      currency_code: "MXN",
      value: cantidad.toString()
    }
  }],
  application_context: {
    return_url: "http://localhost:3000/paciente/pago-exito", // URL a donde PayPal redirige después del pago
    cancel_url: "http://localhost:3000/paciente"             // Si cancelan
  }
});


  try {
    const response = await client().execute(request);
    res.json({
      success: true,
      id: response.result.id,
      links: response.result.links
    });
  } catch (err) {
    console.error('❌ Error creando orden PayPal:', err);
    res.status(500).json({ success: false, message: 'Error creando orden PayPal' });
  }
};



// Capturar orden y registrar el pago en la base de datos
const capturarOrdenPaypal = async (req, res) => {
  const { token } = req.params;
  const folio_cita = req.headers['x-folio-cita'];

  if (!token || !folio_cita) {
    return res.status(400).json({ success: false, message: 'Faltan datos necesarios: token o folio_cita.' });
  }

  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(token);
  request.requestBody({});

  try {
    const response = await client().execute(request);
    const detalles = response.result;

    const monto = detalles?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    const payer_email = detalles?.payer?.email_address;
    const paypal_id = detalles?.id;

    if (!monto || !payer_email || !paypal_id) {
      throw new Error('Faltan datos en la respuesta de PayPal');
    }
    

    await executeStoredProcedure('sp_registrarPagoPaypal', {
      folio_cita,
      monto,
      payer_email,
      paypal_id
    });

    console.log('✅ Captura PayPal exitosa, registrando en BD:', {
    folio_cita,
    monto,
    payer_email,
    paypal_id
    });


    res.json({ success: true, detalles });
  } catch (error) {
    console.error('❌ Error al capturar y registrar la orden PayPal:', error);
    res.status(500).json({ success: false, message: 'Error al capturar la orden', error });
  }
};

module.exports = {
  crearOrdenPaypal,
  capturarOrdenPaypal,
  pagarConTarjeta
};
