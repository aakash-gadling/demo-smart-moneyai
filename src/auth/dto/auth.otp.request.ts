import { IsEmail } from "class-validator";



export class AuthOtpRequest {
    @IsEmail()
    email: string;

}