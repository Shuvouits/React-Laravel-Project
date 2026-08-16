<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transfers', function (Blueprint $table) {
            $table->id();

            $table->string('transfer_no')->unique();

            $table->foreignId('from_location_id')
                ->constrained('inventory_locations');

            $table->foreignId('to_location_id')
                ->constrained('inventory_locations');

            $table->enum('status', [
                'draft',
                'pending',
                'in_transit',
                'partially_received',
                'received',
                'cancelled',
            ])->default('draft');

            $table->text('note')->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('from_location_id');
            $table->index('to_location_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transfers');
    }
};