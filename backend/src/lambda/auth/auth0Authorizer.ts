import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const cert = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJXhAoIbMwGPRJMA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
BAMTFmRldi1icW81Y3l1Yy5hdXRoMC5jb20wHhcNMjAwNTEyMjM1ODQ3WhcNMzQw
MTE5MjM1ODQ3WjAhMR8wHQYDVQQDExZkZXYtYnFvNWN5dWMuYXV0aDAuY29tMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq7aADxwgVEKsm82Jk2fw62eZ
IgOIEJ37VXiU35oHTveyfMvaQQU30qZXWZXe1BhYzyhUAXljhdbCI3Tme41OjGLX
29msy9aM4I2+cP3Lf6sLLxqR6zKLxxgB6OL0Q8o2P3aqmy0N0z6ITkcH3VHoUsgR
L9HRRGOpf3gSjfLfbZ7nP2j7pcRxGmR3Wo6fwZEcW19mLnOAwES8Vzf9WWgAzXfT
M8BhUe+XcKvRJYyEPC0s4AbReZKoRmTmdt+pi6WDtKRYd8NvrYsRg/OY2yVSfIyb
7S5wBfNCYEadzPeMtuKEOQYD7/JnmZRFlxaxTLpl6yGOweuqvnjDyEAE/MbCIQID
AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBSW7UNWIdZJel5tpJKP
a8eVXyRXzjAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAF35uVgH
RLZ5o1g2JCE+d8VjEkRxFi/SPH/itAum8beOGvemqSSx6Jqwhn25wvERKLy9TlJo
yjvLEwnC6l/rGVEMKXN/Ik4ffwAMm5Uth/CF+YoCgXQXR3Z49qzkgJs0gJspvR25
kHHvF12QploSVi5/dVJUuSn9LmT0qLamL7flfNvb3OINQalhNiLAniEgFXkCWURk
+zOfbH06FAs1FK6UguIjB6AatRwoSK+bFL9DZDKF6hMyY7rAQfHJcY7DdDHBTTEM
25BDNbkFc9ChIyGFUz3U71iLrcWKpO2b0ZhPMTblOM+sUS+BYW4/C7S/+XRlSnyO
NmYx3805kmoasVY=
-----END CERTIFICATE-----
`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)

  try {
    const jwtToken = verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

function verifyToken(authHeader: string): JwtPayload {
  const token = getToken(authHeader)
  return verify(token, cert, {algorithms: ['RS256']}) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
