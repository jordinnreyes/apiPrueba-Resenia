const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

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

        // Obtener el reseña_id del parámetro de la URL
        const reseña_id = event.pathParameters.reseña_id; // se obtiene de la URL

        // Eliminar la reseña de DynamoDB
        const params = {
            TableName: REVIEWS_TABLE,
            Key: {
                id_resenia: reseña_id,
                id_usuario: user_id  // Asegurarse de que el usuario esté autorizado a eliminar la reseña
            }
        };

        const result = await dynamodb.delete(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Reseña eliminada con éxito' })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Ocurrió un error al eliminar la reseña' })
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
