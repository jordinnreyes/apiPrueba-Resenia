const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const REVIEWS_TABLE = process.env.REVIEWS_TABLE;

exports.handler = async (event) => {
    try {
        // Inicio - Proteger el Lambda
        const token = event.headers.Authorization;
        const lambda = new AWS.Lambda();

        const authResponse = await lambda.invoke({
            FunctionName: "ValidarTokenAcceso",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({ token })
        }).promise();

        const authPayload = JSON.parse(authResponse.Payload);

        if (authPayload.statusCode === 403) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Forbidden - Acceso No Autorizado' })
            };
        }
        // Fin - Proteger el Lambda

        // Obtener la información del usuario autenticado desde el token validado
        const id_usuario = authPayload.user_id;

        // Consultar las reseñas del usuario en la tabla DynamoDB
        const result = await dynamodb.query({
            TableName: REVIEWS_TABLE,
            KeyConditionExpression: 'id_usuario = :id_usuario',
            ExpressionAttributeValues: {
                ':id_usuario': id_usuario
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ reviews: result.Items })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Ocurrió un error al obtener las reseñas' })
        };
    }
};
