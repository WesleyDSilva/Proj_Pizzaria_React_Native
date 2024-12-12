import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";// Importação do seu contexto de autenticação
import { Alert } from "react-native";

import { api } from "../../services/api";

async function addToCart(productId: string, quantity: number) {
    const { user } = useContext(AuthContext);

    if (!user.id) {
        Alert.alert("Usuário não autenticado.");
        return;
    }

    try {
        const response = await api.post("/api/carrinho.php", {
            cliente_id: user.id, // Enviando o ID do usuário como cliente_id
            produto_id: productId,
            quantidade: quantity,
        });

        if (response.data.success) {
            Alert.alert("Item adicionado ao carrinho com sucesso!");
        } else {
            Alert.alert(`Erro: ${response.data.message}`);
        }
    } catch (error) {
        console.error("Erro ao adicionar ao carrinho:", error);
        Alert.alert("Erro ao adicionar item ao carrinho.");
    }
}
