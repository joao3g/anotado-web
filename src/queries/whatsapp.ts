import * as whatsappService from "../api/services/whatsapp.service";

export const whatsappStatusQuery = () => ({
    queryKey: ['whatsapp-status'],
    queryFn: async () => whatsappService.getStatus(),
});
