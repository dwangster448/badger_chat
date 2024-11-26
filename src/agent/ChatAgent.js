
const createChatAgent = () => {

    const CS571_WITAI_ACCESS_TOKEN = "YCUWRFOLLRLP5DF3LDMEEEBHMQG7KMHH"; // Put your CLIENT access token here.

    let availableItems = [];
    let cart = {};

    const handleInitialize = async () => {
        const resp = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw10/items", {
            headers: {
                "X-CS571-ID": "bid_e382d009e3a8d82810092f47dd226cb5883ce97f636e1544c32b9a097bce83a7"
            }
        })
        const data = await resp.json();
        console.log(data)
        availableItems = data;

        cart = {}; //Forces cart to be empty upon page re/load
        for (const item of availableItems) {
            cart[item.name] = 0; // Set initial quantity for each item to 0
        }
        console.log(cart)
        return "Welcome to BadgerMart Voice! Try your quetsions or ask for help if you're lost!"

    }

    const handleReceive = async (prompt) => {
        //TODO: Replace this with your code to handle a user's message!
        const resp = await fetch("https://api.wit.ai/message?q=" + encodeURIComponent(prompt), {
            headers: {
                "Authorization": "Bearer " + CS571_WITAI_ACCESS_TOKEN
            }
        })
        const data = await resp.json();

        console.log(data)



        if (data.intents.length > 0) {
            switch (data.intents[0].name) {
                case "get_help": return tellJoke(data);
                case "get_items": return getItems(availableItems);
                case "get_price": return getPrice(data);
                case "add_item": return addItem(data);
                case "remove_item": return removeItem(data);
                case "view_cart": return viewCart(cart);
                case "checkout": return checkout(cart);
            }
        }

        //let agentResponse = "";
        //Else (fallback) statement/condition
        //agentResponse += "Sorry, I didn't get that. Type 'help' to see what you can do!"

        return "Sorry, I didn't get that. Type 'help' to see what you can do!";
    }

    const checkout = async (cart) => {
        const checkoutData = {}; //object array for checkout
        for (const item of availableItems) { //GPT proposed method to provide correct formatting for POST
            checkoutData[item.name] = cart[item.name];
        };

        for (const item of Object.entries(checkoutData)) {
            if (item.quantity < 0) {
                return `Invalid quantity for ${item.name}. Quantity must be a positive integer.`;
            }
        }

        if (Object.values(checkoutData).every(quantity => quantity === 0)) { //notice that every value in checkout is already a value, syntax provided by GPT
            return "Your cart is empty. Please add items to your cart before checking out.";
        }

        // Perform POST request to the checkout endpoint
        const res = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw10/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CS571-ID": "bid_e382d009e3a8d82810092f47dd226cb5883ce97f636e1544c32b9a097bce83a7"
            },
            body: JSON.stringify(checkoutData)
        });

        const data = await res.json();

        console.log(data);

        if (res.ok) {
            // Empty the cart after successful checkout
            availableItems.forEach(item => cart[item.name] = 0);
            return `Success! Your confirmation ID is ${data.confirmationId}.`;
        } else {
            return `Checkout failed: ${data.message}`;
        }
    }

    const viewCart = async (cart) => {
        const cartItems = Object.entries(cart).filter(([_, quantity]) => quantity > 0); //GPT method to filters through object keys in cart that has more than 0 items

        if (cartItems.length === 0) {
            return "Your cart is empty.";
        }

        let response = "You have";
        let totalPrice = 0;

        for (const [itemName, quantity] of cartItems) {  //Iterator structure provided by GPT
            const item = availableItems.find(
                availableItem => availableItem.name.toLowerCase() === itemName.toLowerCase() //Used previous GPT solution for add/remove
            );
            const itemTotal = item.price * quantity;
            totalPrice += itemTotal;
            response += ` ${quantity} ${item.name}`; //String concatenation
        }


        response += `, totaling $${totalPrice.toFixed(2)}`;
        return response;
    }


    const removeItem = async (data) => {
        const hasSpecifiedType = data.entities["item_type:item_type"] ? true : false;
        const hasSpecifiedNumber = data.entities["wit$number:number"] ? true : false;
        console.log(data.entities["item_type:item_type"])

        const itemName = hasSpecifiedType ? data.entities["item_type:item_type"][0].value : "any";

        if (itemName == "any") {
            return `Sorry, we don't have ${itemName} in stock.`;
        }

        const item = availableItems.find(
            availableItem => availableItem.name.toLowerCase() === itemName.toLowerCase() //GPT find function syntax provided in add
        );

        let quantity = hasSpecifiedNumber ? data.entities["wit$number:number"][0].value : 1; // Default to 1 if not provided
        console.log(quantity)
        quantity = Math.floor(quantity); // Round down to nearest integer

        if (quantity <= 0) {
            return "The quantity must be greater than 0. Please try again!";
        }

        // if (!cart[item.name]) { //Needed if item isn't intialized as object key in array
        //     cart[item.name] = 0;
        //     return "";
        // }

        if (quantity >= cart[item.name]) {
            cart[item.name] = 0; // Remove all items if quantity is more or equal to the cart quantity, approach provided by GPT
            console.log(cart)
            return `Sure, removing ${quantity} ${item.name}${quantity > 1 ? "s" : ""} from your cart.`;
        }

        cart[item.name] -= quantity; // Decrease the quantity
        console.log(cart)
        return `Sure, removing ${quantity} ${item.name}${quantity > 1 ? "s" : ""} from your cart.`;
    }


    const addItem = async (data) => {
        const hasSpecifiedType = data.entities["item_type:item_type"] ? true : false;
        const hasSpecifiedNumber = data.entities["wit$number:number"] ? true : false;
        console.log(data.entities["item_type:item_type"])

        const itemName = hasSpecifiedType ? data.entities["item_type:item_type"][0].value : "any";

        if (itemName == "any") {
            return `Sorry, we don't have ${itemName} in stock.`;
        }

        const item = availableItems.find(
            availableItem => availableItem.name.toLowerCase() === itemName.toLowerCase() //GPT solution for syntaxical sugar of find in availableItem
        );

        let quantity = hasSpecifiedNumber ? data.entities["wit$number:number"][0].value : 1; // Default to 1 if not provided
        console.log(quantity)
        quantity = Math.floor(quantity); // Round down to nearest integer, precaution provided by GPT

        if (quantity <= 0) {
            return "The quantity must be greater than 0. Please try again!";
        }

        // if (!cart[item.name]) { //Needed if item isn't intialized as object key in array
        //     cart[item.name] = 0;
        // }
        cart[item.name] += quantity;

        console.log(cart)

        return `Sure, adding ${quantity} ${item.name}${quantity > 1 ? "s" : ""} to your cart.`; //GPT recommendation for grammatical improvements 
    }

    const getPrice = async (data) => {
        const hasSpecifiedType = data.entities["item_type:item_type"] ? true : false;
        console.log(data.entities["item_type:item_type"])

        const itemName = hasSpecifiedType ? data.entities["item_type:item_type"][0].value : "any";

        if (itemName != "any") {
            const item = availableItems.find(
                availableItem => availableItem.name.toLowerCase() === itemName.toLowerCase()
            );
            return `${item.name} cost $${item.price} each.`;
        } else {
            return `Sorry, we don't have ${itemName} in stock.`;
        }
    }

    const getItems = async (availableItems) => {
        const itemNames = availableItems.map(item => item.name); //Retrieves only the names of each items in availableItems

        let agentResponse = "We have ";

        if (itemNames.length === 1) {
            agentResponse += `${itemNames[0]} for sale!`;
        } else {
            agentResponse += `${itemNames.slice(0, -1).join(', ')}, and ${itemNames[itemNames.length - 1]} for sale!`; //Syntaxical sugar by GPT to add comma to all but the last element in availableItems
        }
        return agentResponse;
    }

    const tellJoke = async () => {
        return "In BadgerMart Voice, you can get the list of items, the price of an item, add or remove an item from your cart, and checkout!";
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createChatAgent;