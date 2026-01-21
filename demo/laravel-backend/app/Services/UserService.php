<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UserService
{
    public function updateUser(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            if (isset($data['avatar'])) {
                // Delete old avatar
                if ($user->avatar) {
                    Storage::delete($user->avatar);
                }
                
                $data['avatar'] = $data['avatar']->store('avatars', 'public');
            }
            
            $user->update($data);
            
            Log::info('User updated', ['user_id' => $user->id]);
            
            return $user->fresh();
        });
    }

    public function deleteUser(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            // Delete avatar
            if ($user->avatar) {
                Storage::delete($user->avatar);
            }
            
            Log::warning('User deleted', ['user_id' => $user->id]);
            
            return $user->delete();
        });
    }
}
