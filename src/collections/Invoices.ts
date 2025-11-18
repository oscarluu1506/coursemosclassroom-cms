import type { CollectionConfig } from 'payload'

export const Invoices: CollectionConfig = {
    slug: 'invoices',
    admin: {
        useAsTitle: 'invoiceNumber',
        defaultColumns: ['invoiceNumber', 'customer', 'amount', 'status', 'dueDate'],
    },
    access: {
        read: ({ req }) => true,
        create: ({ req }) => true,
        update: ({ req }) => true,
        delete: ({ req }) => !!req.user,
    },
    fields: [
        {
            name: 'invoiceNumber',
            type: 'text',
            required: true,
            unique: true,
            defaultValue: () => {
                const date = new Date();
                const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                return `INV-${dateStr}-${random}`;
            },
            admin: {
                readOnly: true,
            },
        },
        {
            name: 'customer',
            type: 'relationship',
            relationTo: 'customers',
            required: true,
        },
        {
            name: 'subscription',
            type: 'relationship',
            relationTo: 'subscriptions',
            required: true,
        },
        {
            name: 'plan',
            type: 'relationship',
            relationTo: 'plans',
            required: true,
        },
        {
            name: 'amount',
            type: 'number',
            required: true,
        },
        {
            name: 'currency',
            type: 'select',
            options: ['USD', 'EUR', 'VND'],
            defaultValue: 'USD',
        },
        {
            name: 'status',
            type: 'select',
            options: ['draft', 'pending', 'paid', 'failed', 'refunded', 'cancelled'],
            defaultValue: 'draft',
        },
        {
            name: 'billingPeriod',
            type: 'group',
            fields: [
                {
                    name: 'start',
                    type: 'date',
                    required: true,
                },
                {
                    name: 'end',
                    type: 'date',
                    required: true,
                },
            ],
        },
        {
            name: 'dueDate',
            type: 'date',
            required: true,
        },
        {
            name: 'paidDate',
            type: 'date',
        },
        {
            name: 'items',
            type: 'array',
            admin: {
                description: 'Add invoice line items',
                initCollapsed: true, // Thu gọn array mặc định
            },
            fields: [
                {
                    name: 'description',
                    type: 'text',
                    required: true,
                    admin: {
                        placeholder: 'Item description',
                    },
                },
                {
                    name: 'amount',
                    type: 'number',
                    required: true,
                    admin: {
                        placeholder: '0.00',
                    },
                },
                {
                    name: 'quantity',
                    type: 'number',
                    required: true,
                    defaultValue: 1,
                    admin: {
                        placeholder: '1',
                    },
                },
                {
                    name: 'metadata',
                    type: 'json',
                    admin: {
                        description: 'Additional item data (optional)',
                    },
                },
            ],
        },
        {
            name: 'subtotal',
            type: 'number',
            required: true,
            admin: {
                readOnly: true,
                description: 'Auto-calculated from items',
            },
        },
        {
            name: 'taxAmount',
            type: 'number',
            defaultValue: 0,
            admin: {
                description: 'Tax amount',
            },
        },
        {
            name: 'totalAmount',
            type: 'number',
            required: true,
            admin: {
                readOnly: true,
                description: 'Auto-calculated total',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                placeholder: 'Additional invoice notes...',
            },
        },
        {
            name: 'metadata',
            type: 'json',
            admin: {
                description: 'Additional invoice data',
            },
        },
    ],
    hooks: {
        beforeValidate: [
            ({ data, operation }) => {
                if (data) {
                    // Auto-calculate totals từ items
                    if (data.items && Array.isArray(data.items)) {
                        const subtotal = data.items.reduce((sum: number, item: any) => {
                            const itemAmount = Number(item.amount) || 0;
                            const itemQuantity = Number(item.quantity) || 1;
                            return sum + (itemAmount * itemQuantity);
                        }, 0);

                        data.subtotal = subtotal;
                        data.totalAmount = subtotal + (Number(data.taxAmount) || 0);

                        // Đảm bảo amount bằng totalAmount
                        if (!data.amount || operation === 'create') {
                            data.amount = data.totalAmount;
                        }
                    }
                }
                return data;
            },
        ],

        beforeChange: [
            ({ data, operation, originalDoc }) => {
                if (operation === 'update') {
                    // Khi update, giữ nguyên items nếu không được cung cấp
                    if (!data.items && originalDoc?.items) {
                        data.items = originalDoc.items;
                    }
                }

                if (operation === 'create') {
                    // Đảm bảo có ít nhất một item mặc định
                    if (!data.items || data.items.length === 0) {
                        data.items = [
                            {
                                description: 'Subscription Fee',
                                amount: data.amount || 0,
                                quantity: 1,
                            }
                        ];
                    }

                    // Auto-calculate nếu chưa có
                    if (data.items && (!data.subtotal || !data.totalAmount)) {
                        const subtotal = data.items.reduce((sum: number, item: any) => {
                            return sum + ((item.amount || 0) * (item.quantity || 1));
                        }, 0);

                        data.subtotal = subtotal;
                        data.totalAmount = subtotal + (data.taxAmount || 0);
                    }
                }
                return data;
            },
        ],
    },
    timestamps: true,
}
