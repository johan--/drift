<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    /**
     * Get all users (admin only)
     */
    public function index(): AnonymousResourceCollection
    {
        Log::info('Fetching all users');
        
        $users = User::with(['orders', 'profile'])->paginate(20);
        
        return UserResource::collection($users);
    }

    /**
     * Get current authenticated user
     */
    public function current(Request $request): UserResource
    {
        return new UserResource($request->user()->load('profile'));
    }

    /**
     * Update current user
     */
    public function update(UpdateUserRequest $request): UserResource
    {
        $user = $this->userService->updateUser(
            $request->user(),
            $request->validated()
        );

        Log::info('User updated', ['user_id' => $user->id]);

        return new UserResource($user);
    }

    /**
     * Delete a user (admin only)
     */
    public function destroy(User $user): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $user);
        
        $this->userService->deleteUser($user);
        
        Log::warning('User deleted', ['user_id' => $user->id]);

        return response()->json(['message' => 'User deleted successfully']);
    }
}
