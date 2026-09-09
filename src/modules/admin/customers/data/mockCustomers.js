export const MOCK_CUSTOMERS = [
    {
        id: 1,
        name: "أحمد محمد",
        phone: "01012345678",
        address: "15 شارع النيل - القاهرة",
        orderType: "أونلاين",
        social: {
            facebook: "https://facebook.com/ahmed.mohamed",
            whatsapp: "https://wa.me/201012345678",
            tiktok: "https://tiktok.com/@ahmed.mohamed",
            instagram: "https://instagram.com/ahmed.mohamed",
        },
        feedback: "المكان ممتاز والقهوة لذيذة جداً، بس نفسي يكون فيه تكييف أقوى",
        orders: [
            { id: 901, orderNumber: "A-1001", totalPrice: 150, date: "2026-08-25" },
            { id: 905, orderNumber: "A-1003", totalPrice: 250, date: "2026-08-24" },
        ],
    },
    {
        id: 2,
        name: "سارة علي",
        phone: "01087654321",
        address: "22 شارع مصطفى النحاس - الإسكندرية",
        orderType: "طربيزات",
        social: {
            facebook: "https://facebook.com/sara.ali",
            whatsapp: "https://wa.me/201087654321",
            tiktok: null,
            instagram: "https://instagram.com/sara.ali",
        },
        feedback: null,
        orders: [
            { id: 903, orderNumber: "A-1002", totalPrice: 80, date: "2026-08-25" },
        ],
    },
    {
        id: 3,
        name: "خالد حسن",
        phone: "01011223344",
        address: null,
        orderType: "أونلاين",
        social: {
            facebook: null,
            whatsapp: "https://wa.me/201011223344",
            tiktok: null,
            instagram: null,
        },
        feedback: "التوصيل كان بطيء شوية بس الأكل كان حلو",
        orders: [
            { id: 907, orderNumber: "A-1004", totalPrice: 45, date: "2026-08-24" },
        ],
    },
    {
        id: 4,
        name: "فاطمة أحمد",
        phone: "01099887766",
        address: "5 شارع الجيش - أسوان",
        orderType: "طربيزات",
        social: {
            facebook: "https://facebook.com/fatma.ahmed",
            whatsapp: "https://wa.me/201099887766",
            tiktok: "https://tiktok.com/@fatma.ahmed",
            instagram: "https://instagram.com/fatma.ahmed",
        },
        feedback: "أحلى مكان في أسوان بجد ❤️",
        orders: [],
    },
];
