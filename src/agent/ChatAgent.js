
const createChatAgent = () => {

    const CS571_WITAI_ACCESS_TOKEN = ""; // Put your CLIENT access token here.

    let availableItems = [];

    const handleInitialize = async () => {
        
    }

    const handleReceive = async (prompt) => {
        // TODO: Replace this with your code to handle a user's message!
        return "Your message has been received. Maybe I should contact Wit.AI to figure out what you intend..."
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createChatAgent;