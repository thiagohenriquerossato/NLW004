import { Request, Response } from "express";
import { getCustomRepository, IsNull, Not } from "typeorm";
import {resolve} from 'path';

import { SurveyRepository } from "../repositories/SurveysRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import SendMailService from "../services/SendMailService";
import { AppError } from "../errors/AppError";


class SendMailController {
    async execute(request: Request, response: Response){
        const { email , survey_id}= request.body;

        const usersRepository = getCustomRepository(UsersRepository);
        const surveyRepository = getCustomRepository(SurveyRepository);
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

        const user = await usersRepository.findOne({email});

        if(!user){
            throw new AppError("User does not exists!");
        }

        const survey = await surveyRepository.findOne({id: survey_id});

        if(!survey){
            throw new AppError("Survey user does not exists");
        }  

        
        const npsPath = resolve(__dirname,"..","views","emails","npsMail.hbs");
        
        const surveyUserAlreadyAnwsered = await surveysUsersRepository.findOne({
            where: { user_id: user.id, value: Not(IsNull()), survey_id: survey_id }, 
          });
      
          if (surveyUserAlreadyAnwsered) {
            throw new AppError("Survey already answered for this user!");
          }

        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: { user_id: user.id, value: null, survey_id: survey_id },
            relations: ["user", "survey"],
          });

        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: "",
            link: process.env.URL_MAIL,
        }

        if(surveyUserAlreadyExists){
            variables.id = surveyUserAlreadyExists.id;
            await SendMailService.execute(email, survey.title, variables, npsPath)
            return response.json(surveyUserAlreadyExists)
        }

        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id,
        });

        
        await surveysUsersRepository.save(surveyUser);

        variables.id = surveyUser.id;
        
        await SendMailService.execute(email, survey.title, variables, npsPath )

        return response.json(surveyUser);
    }
}

export {SendMailController}