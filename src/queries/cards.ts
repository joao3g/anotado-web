import * as cardService from "../api/services/card.service";

export const cardsQuery = () => ({
    queryKey: ['cards'],
    queryFn: async () => cardService.listCards(),
});
