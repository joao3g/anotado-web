import { redirect } from "react-router";
import { authMiddleware } from "./auth";
import { cardsQuery } from "../queries/cards";
import type { QueryClient } from "@tanstack/react-query";

export const cardsLoader = (queryClient: QueryClient) =>
    async () => {
        try {
            authMiddleware();

            return {
                cards: await queryClient.ensureQueryData(cardsQuery())
            };
        } catch (e) {
            if (e instanceof Response) {
                throw e;
            }

            throw redirect("/error");
        }
    }
