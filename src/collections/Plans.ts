import type { CollectionConfig } from 'payload'

export const Plans: CollectionConfig = {
    slug: 'plans',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'price', 'currency', 'billingPeriod', 'status'],
    },
    access: {
        read: () => true,
        create: ({ req }) => !!req.user,
        update: ({ req }) => !!req.user,
        delete: ({ req }) => !!req.user,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'price',
            type: 'number',
            required: true,
            min: 0,
        },
        {
            name: 'currency',
            type: 'select',
            options: ['USD', 'EUR', 'VND'],
            defaultValue: 'USD',
            required: true,
        },
        {
            name: 'billingPeriod',
            type: 'select',
            options: [
                {
                    label: 'Monthly',
                    value: 'monthly',
                },
                {
                    label: 'Quarterly',
                    value: 'quarterly',
                },
                {
                    label: 'Yearly',
                    value: 'yearly',
                },
            ],
            defaultValue: 'monthly',
            required: true,
        },
        {
            name: 'features',
            type: 'array',
            fields: [
                {
                    name: 'feature',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'included',
                    type: 'checkbox',
                    defaultValue: true,
                },
                {
                    name: 'limit',
                    type: 'number',
                    admin: {
                        condition: (data, siblingData) => siblingData.included === true,
                    },
                },
                {
                    name: 'unit',
                    type: 'text',
                    admin: {
                        condition: (data, siblingData) =>
                            siblingData.included === true && siblingData.limit,
                    },
                },
            ],
        },
        // Meeting room specific features
        {
            name: 'maxParticipants',
            type: 'number',
            required: true,
            defaultValue: 50,
        },
        {
            name: 'maxDuration',
            type: 'number',
            label: 'Max Duration (minutes)',
            defaultValue: 60,
        },
        {
            name: 'recordingStorage',
            type: 'number',
            label: 'Recording Storage (GB)',
            defaultValue: 1,
        },
        {
            name: 'maxRooms',
            type: 'number',
            label: 'Maximum Concurrent Rooms',
            defaultValue: 1,
        },
        {
            name: 'whiteboard',
            type: 'checkbox',
            defaultValue: true,
        },
        // {
        //     name: 'breakoutRooms',
        //     type: 'checkbox',
        //     defaultValue: false,
        // },
        // {
        //     name: 'customBranding',
        //     type: 'checkbox',
        //     defaultValue: false,
        // },
        {
            name: 'totalMinutes',
            type: 'number',
            label: 'Total Minutes',
            defaultValue: 360,
        },
        {
            name: 'status',
            type: 'select',
            options: ['active', 'inactive', 'archived'],
            defaultValue: 'active',
        },
        {
            name: 'sortOrder',
            type: 'number',
            defaultValue: 0,
        },
    ],
}
