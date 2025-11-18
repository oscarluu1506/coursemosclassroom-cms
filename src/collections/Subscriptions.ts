import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
    slug: 'subscriptions',
    admin: {
        useAsTitle: 'id',
        defaultColumns: ['customer', 'plan', 'status', 'startDate', 'endDate'],
    },
    access: {
        read: ({ req }) => true,
        create: ({ req }) => true,
        update: ({ req }) => true,
        delete: ({ req }) => !!req.user,
    },
    fields: [
        {
            name: 'customer',
            type: 'relationship',
            relationTo: 'customers',
            required: true,
            hasMany: false,
        },
        {
            name: 'plan',
            type: 'relationship',
            relationTo: 'plans',
            required: true,
            hasMany: false,
        },
        {
            name: 'startDate',
            type: 'date',
            required: true,
        },
        {
            name: 'endDate',
            type: 'date',
            required: true,
        },
        {
            name: 'status',
            type: 'select',
            options: [
                {
                    label: 'Active',
                    value: 'active',
                },
                {
                    label: 'Inactive',
                    value: 'inactive',
                },
                {
                    label: 'Cancelled',
                    value: 'cancelled',
                },
                {
                    label: 'Expired',
                    value: 'expired',
                },
                {
                    label: 'Pending',
                    value: 'pending',
                },
            ],
            defaultValue: 'pending',
        },
        {
            name: 'autoRenew',
            type: 'checkbox',
            defaultValue: true,
        },
        {
            name: 'currentPeriodStart',
            type: 'date',
        },
        {
            name: 'currentPeriodEnd',
            type: 'date',
        },
        {
            name: 'cancelAtPeriodEnd',
            type: 'checkbox',
            defaultValue: false,
        },
        {
            name: 'trialEnd',
            type: 'date',
        },
        {
            name: 'usage',
            type: 'group',
            fields: [
                {
                    name: 'participantsUsed',
                    type: 'number',
                    defaultValue: 0,
                },
                {
                    name: 'durationUsed',
                    type: 'number',
                    label: 'Duration Used (minutes)',
                    defaultValue: 0,
                },
                {
                    name: 'storageUsed',
                    type: 'number',
                    label: 'Storage Used (GB)',
                    defaultValue: 0,
                },
                {
                    name: 'roomsUsed',
                    type: 'number',
                    defaultValue: 0,
                },
            ],
        },
    ],
    hooks: {
        beforeChange: [
            ({ data, operation }) => {
                if (operation === 'create') {
                    // Set current period dates based on start date and plan's billing period
                    if (data.startDate && !data.currentPeriodStart) {
                        data.currentPeriodStart = data.startDate
                    }
                }
                return data
            },
        ],
    },
    timestamps: true,
}
