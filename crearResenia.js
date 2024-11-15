const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken'); // Usamos la librería JWT
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { DateTime } = require('luxon');

const REVIEWS_TABLE = process.env.REVIEWS_TABLE;

exports.handler = async (event) => {
    try {
        // Obtener el token del encabezado Authorization
        const token = event.headers.Authorization.split(' ')[1]; // "Bearer <token>"

        // Verificar el token utilizando el microservicio Usuario
        const authPayload = await verifyToken(token);
        
        if (!authPayload) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Token inválido o expirado' })
            };
        }

        const user_id = authPayload.user_id; // El ID del usuario autenticado

        // Procesar la solicitud de la reseña
        const data = JSON.parse(event.body);
        const item = {
            id_usuario: user_id,
            id_resenia: uuid.v4(),
            id_vuelo: data.id_vuelo,
            calificacion: data.calificacion,
            comentario: data.comentario,
            fecha_resena: data.fecha_resena
        };

        // Guardar la reseña en DynamoDB
        await dynamodb.put({
            TableName: REVIEWS_TABLE,
            Item: item
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Reseña creada con éxito' })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Ocurrió un error al crear la reseña' })
        };
    }
};

// Función para verificar el token JWT en el microservicio Usuario
async function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET; // Asegúrate de que esta clave esté configurada en tus variables de entorno
        const payload = jwt.verify(token, secret); // Verifica el token
        return payload; // Devuelve los datos del payload si el token es válido
    } catch (error) {
        console.error('Token inválido o expirado', error);
        return null; // Si el token es inválido o expirado
    }
}
