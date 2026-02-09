import { Router, Request, Response } from 'express';

const router = Router();

// USSD endpoint - Africa's Talking will POST here
router.post('/', (req: Request, res: Response) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    // Basic USSD menu structure
    let response = '';

    if (text === '') {
        // Main menu
        response = `CON Murakaza neza kuri Umurage
1. Reba Amafaranga (Check Balance)
2. Tanga Umusanzu (Contribute)
3. Saba Inguzanyo (Request Loan)
4. Reba Inguzanyo (Check Loan)
5. Ubufasha (Help)`;
    } else {
        // Handle menu selections - to be implemented
        response = 'END Murakoze! (Thank you!)';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

export default router;
