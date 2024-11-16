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

        const user_id = authPayload.user_id; // ID del usuario autenticado

        // Obtener el id_resenia y los nuevos datos del cuerpo de la solicitud
        const { id_resenia, calificacion, comentario } = JSON.parse(event.body);

        // Actualizar la reseña en DynamoDB
        const params = {
            TableName: REVIEWS_TABLE,
            Key: {
                id_usuario: user_id,       // Clave de partición
                id_resenia: id_resenia    // Clave de ordenamiento
            },
            UpdateExpression: 'SET calificacion = :cal, comentario = :com',
            ExpressionAttributeValues: {
                ':cal': calificacion,
                ':com': comentario
            },
            ReturnValues: 'UPDATED_NEW'
        };

        const result = await dynamodb.update(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Reseña actualizada con éxito',
                data: result.Attributes // Devuelve los nuevos valores
            })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Ocurrió un error al actualizar la reseña' })
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
