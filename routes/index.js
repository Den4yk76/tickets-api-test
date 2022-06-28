import { Router } from 'express';
import { HttpCode } from '../lib/constants';
import { createClient } from 'redis';

const router = new Router();
const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));
await client.connect();

router.post('/input', inputRouter);
router.post('/output', outputRouter);

async function inputRouter(req, res, next) {
    const { number } = req.body; // incoming number
    const tickets = await client.get('tickets'); // get list of available tickets

    if (!tickets) { // if no tickets
        const setTickets = await client.set(tickets, []); // create tickets list
        const ticket = setTickets.length + 1; // get ticket
        client.set(tickets, [...setTickets, ticket]); // set ticket

        //creating Fibonacci list
        const fib = [0, 1];

        for (let i = 2; i <= number - 1; i++) {
            fib[i] = fib[i - 2] + fib[i - 1];
        }

        const FibResponse = number <= 0 ? fib[0] : fib[number - 1]; // getting Fibonacci number
        client.set(ticket, FibResponse); // setting ticketNumber: FibonacciNumber

        return res.status(HttpCode.OK).json({
            status: 'success',
            code: HttpCode.OK,
            ticket,
        });
    } else {
        const ticket = tickets.length + 1; // get ticket
        client.set(tickets, [...tickets, ticket]); // set ticket
        return res.status(HttpCode.OK).json({
            status: 'success',
            code: HttpCode.OK,
            ticket,
        });
    }
}

async function outputRouter(req, res, next) {
    const { ticket } = req.params; // incoming ticket number
    const FibValue = await client.get(ticket) // getting Fibonacci number from ticket list

    if (FibValue) { // check if Fibonacci number already exist in redis db
        return res.status(HttpCode.OK).json({
            status: 'success',
            code: HttpCode.OK,
            fibonacci: FibValue,
        });
    } else { // or send Not Found response
        return res.status(HttpCode.NOT_FOUND).json({
            status: 'fail',
            code: HttpCode.NOT_FOUND,
            message: 'Not Found',
        });
    }
}

export default router;
