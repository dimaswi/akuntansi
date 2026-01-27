<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h2 {
            margin: 0;
            font-size: 18px;
        }
        .header p {
            margin: 5px 0;
            font-size: 11px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #f3f4f6;
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-weight: bold;
        }
        td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{ $title }}</h2>
        <p>Dicetak pada: {{ $generatedAt }}</p>
    </div>

    @php
        // Check if ranking report (has 'rank' column selected)
        $isRankingReport = in_array('rank', $columnsToShow);
    @endphp

    <table>
        <thead>
            <tr>
                @if(!$isRankingReport)
                    <th>No</th>
                @endif
                @foreach($columnsToShow as $columnValue)
                    @php
                        $column = collect($columns)->firstWhere('value', $columnValue);
                    @endphp
                    <th>{{ $column['label'] ?? $columnValue }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($data as $index => $row)
                <tr>
                    @if(!$isRankingReport)
                        <td>{{ $index + 1 }}</td>
                    @endif
                    @foreach($columnsToShow as $columnValue)
                        <td>
                            @php
                                $value = $row[$columnValue] ?? '-';

                                // Format currency
                                if (strpos($columnValue, 'amount') !== false || strpos($columnValue, 'price') !== false) {
                                    $value = is_numeric($value) ? 'Rp ' . number_format($value, 0, ',', '.') : $value;
                                }
                            @endphp
                            {{ $value }}
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Total: {{ count($data) }} data</p>
    </div>
</body>
</html>
