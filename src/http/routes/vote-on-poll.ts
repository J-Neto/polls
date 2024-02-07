import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'

export async function voteOnPoll(app:FastifyInstance) {
  app.post('/polls/:pollId/votes', async (request, reply)=> {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    })

    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    })

    const { pollId } = voteOnPollParams.parse(request.params)
    const { pollOptionId } = voteOnPollBody.parse(request.body)
  
    let { sessionId } = request.cookies;

    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId
          }
        }
      })

      if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId != pollOptionId) {
        // Apagar o voto anterior
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id
          }
        })
      } else if (userPreviousVoteOnPoll) {
        return reply.status(400).send({ message: 'You already voted on this poll.' })
      }
    }

    if(!sessionId) {
      sessionId = randomUUID()
  
      reply.setCookie('sessionId', sessionId, {
        path: '/', // Quais rotas podem acessar este cookie (Neste caso, todas)
        maxAge: 60 * 60 *24 * 30, // 30 days - tempo expiração do cookie,
        signed: true, // Assinado, ou seja, o usuario nao podera alterar este cookie
        httpOnly: true // So pode ser acessado pelo backend
      })
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId
      }
    })
    
    return reply.status(201).send()
  })
}