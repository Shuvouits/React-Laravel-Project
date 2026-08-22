<!DOCTYPE html>
<html>

<head>

<title>Invoice</title>

<style>

@page {
    margin: 40px;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #1e293b;
    font-size: 13px;
}


.header {
    width:100%;
}


.header td {
    vertical-align:top;
}


.invoice-title {
    font-size:32px;
    font-weight:bold;
    color:#111827;
}


.logo {
    text-align:right;
    font-size:28px;
    font-weight:bold;
    color:#2563eb;
}



.small-text {
    line-height:1.8;
    color:#64748b;
}


.divider {
    border-top:1px solid #e5e7eb;
    margin:25px 0;
}



.info-table {
    width:100%;
}


.info-table td {
    width:50%;
    vertical-align:top;
}


.heading {
    font-size:15px;
    font-weight:bold;
    margin-bottom:8px;
}


.items-title {
    font-size:18px;
    font-weight:bold;
    margin-bottom:15px;
}



.items {
    width:100%;
    border-collapse:collapse;
}


.items th {

    text-align:left;
    padding:12px 8px;
    border-bottom:1px solid #ddd;
    font-weight:bold;

}


.items td {

    padding:14px 8px;
    border-bottom:1px solid #eee;

}


.right {
    text-align:right;
}


.center {
    text-align:center;
}



.summary {

    width:300px;
    margin-left:auto;
    margin-top:25px;

}



.summary td {

    padding:8px 0;

}



.total td {

    border-top:1px solid #333;
    padding-top:15px;
    font-size:20px;
    font-weight:bold;

}



.footer {

    position:fixed;
    bottom:25px;
    left:40px;
    right:40px;
    border-top:1px solid #eee;
    padding-top:10px;
    color:#64748b;
    font-size:11px;

}


</style>


</head>


<body>



<table class="header">

<tr>

<td width="60%">


<div class="invoice-title">
Invoice
</div>


<br>


<div class="small-text">


<b>Invoice number</b>

&nbsp;&nbsp;

{{ $order->order_no }}


<br>


<b>Date of issue</b>

&nbsp;&nbsp;

{{ $order->created_at->format('d M Y') }}


<br>


<b>Date due</b>

&nbsp;&nbsp;

{{ $order->created_at->addDays(30)->format('d M Y') }}


<br>


<b>Status</b>

&nbsp;&nbsp;

{{ ucfirst($order->status) }}



</div>



</td>



<td width="40%">


<div class="logo">

Storify

</div>


</td>


</tr>


</table>




<div class="divider"></div>




<table class="info-table">

<tr>


<td>


<div class="heading">
Storify
</div>


<div class="small-text">

Main street, New York, 1000

<br>

+17759865200

<br>

store@example.com


</div>


</td>



<td>


<div class="heading">
Bill to
</div>


<div class="small-text">


<b>

{{ $order->shippingAddress->first_name }}

{{ $order->shippingAddress->last_name }}

</b>


<br>


{{ $order->shippingAddress->address_line1 }}


<br>


{{ $order->shippingAddress->city }},

{{ $order->shippingAddress->country }}


<br>


{{ $order->shippingAddress->phone }}



</div>


</td>


</tr>


</table>




<br><br>



<div class="items-title">
Invoice details
</div>




<table class="items">


<tr>

<th width="8%">
#
</th>


<th>
Description
</th>


<th width="10%">
Qty
</th>


<th width="18%">
Unit price
</th>


<th width="18%">
Total
</th>


</tr>




@foreach($order->items as $key=>$item)


<tr>


<td>
{{ $key+1 }}
</td>


<td>
{{ $item->product_name }}
</td>


<td class="center">
{{ $item->quantity }}
</td>


<td>

${{ number_format($item->unit_price,2) }}

</td>


<td class="right">

${{ number_format($item->line_total,2) }}

</td>


</tr>



@endforeach



</table>






<table class="summary">


<tr>

<td>
Subtotal
</td>


<td class="right">

${{ number_format($order->subtotal,2) }}

</td>

</tr>



<tr>

<td>
Shipping
</td>


<td class="right">

${{ number_format($order->shipping_total ?? 0,2) }}

</td>

</tr>



<tr>

<td>
Taxes
</td>


<td class="right">

${{ number_format($order->tax_total ?? 0,2) }}

</td>

</tr>




<tr class="total">


<td>
Total
</td>


<td class="right">

${{ number_format($order->grand_total ?? 0,2) }}

</td>


</tr>


</table>





<div class="footer">


<table width="100%">

<tr>


<td>

<b>NOTES</b>

<br>

We appreciate your business. Should you need to add VAT or extra notes let us know!


</td>



<td align="right">

<b>Have a question?</b>

<br>

store@example.com


</td>


</tr>


</table>


</div>





</body>

</html>