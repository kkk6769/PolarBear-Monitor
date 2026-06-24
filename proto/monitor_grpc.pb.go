package proto

import (
	context "context"
	grpc "google.golang.org/grpc"
)

// ----------------------------------------------------------
// MonitorServiceClient — Agent 端调用的 Client
// ----------------------------------------------------------
type MonitorServiceClient interface {
	ReportSystemState(ctx context.Context, opts ...grpc.CallOption) (MonitorService_ReportSystemStateClient, error)
	ReportSystemInfo(ctx context.Context, in *Host, opts ...grpc.CallOption) (*Receipt, error)
}

type monitorServiceClient struct {
	cc grpc.ClientConnInterface
}

func NewMonitorServiceClient(cc grpc.ClientConnInterface) MonitorServiceClient {
	return &monitorServiceClient{cc}
}

func (c *monitorServiceClient) ReportSystemState(ctx context.Context, opts ...grpc.CallOption) (MonitorService_ReportSystemStateClient, error) {
	stream, err := c.cc.NewStream(ctx, &MonitorService_ServiceDesc.Streams[0], "/proto.MonitorService/ReportSystemState", opts...)
	if err != nil {
		return nil, err
	}
	return &monitorServiceReportSystemStateClient{stream}, nil
}

type MonitorService_ReportSystemStateClient interface {
	Send(*State) error
	CloseAndRecv() (*Receipt, error)
	grpc.ClientStream
}

type monitorServiceReportSystemStateClient struct {
	grpc.ClientStream
}

func (x *monitorServiceReportSystemStateClient) Send(m *State) error {
	return x.ClientStream.SendMsg(m)
}
func (x *monitorServiceReportSystemStateClient) CloseAndRecv() (*Receipt, error) {
	if err := x.ClientStream.CloseSend(); err != nil {
		return nil, err
	}
	m := new(Receipt)
	if err := x.ClientStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (c *monitorServiceClient) ReportSystemInfo(ctx context.Context, in *Host, opts ...grpc.CallOption) (*Receipt, error) {
	out := new(Receipt)
	err := c.cc.Invoke(ctx, "/proto.MonitorService/ReportSystemInfo", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// ----------------------------------------------------------
// MonitorServiceServer — Dashboard 端实现的 Server 接口
// ----------------------------------------------------------
type MonitorServiceServer interface {
	ReportSystemState(MonitorService_ReportSystemStateServer) error
	ReportSystemInfo(context.Context, *Host) (*Receipt, error)
	mustEmbedUnimplementedMonitorServiceServer()
}

type UnimplementedMonitorServiceServer struct{}

func (UnimplementedMonitorServiceServer) ReportSystemState(MonitorService_ReportSystemStateServer) error {
	return nil
}
func (UnimplementedMonitorServiceServer) ReportSystemInfo(context.Context, *Host) (*Receipt, error) {
	return &Receipt{Ok: true}, nil
}
func (UnimplementedMonitorServiceServer) mustEmbedUnimplementedMonitorServiceServer() {}

type UnsafeMonitorServiceServer interface {
	mustEmbedUnimplementedMonitorServiceServer()
}

// ----------------------------------------------------------
// ReportSystemState server stream — Agent 推送 → Dashboard 接收
// ----------------------------------------------------------
type MonitorService_ReportSystemStateServer interface {
	Recv() (*State, error)
	SendAndClose(*Receipt) error
	grpc.ServerStream
}

type monitorServiceReportSystemStateServer struct {
	grpc.ServerStream
}

func (x *monitorServiceReportSystemStateServer) Recv() (*State, error) {
	m := new(State)
	if err := x.ServerStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}
func (x *monitorServiceReportSystemStateServer) SendAndClose(m *Receipt) error {
	return x.ServerStream.SendMsg(m)
}

// ----------------------------------------------------------
// Service descriptor (for server registration)
// ----------------------------------------------------------
var MonitorService_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "proto.MonitorService",
	HandlerType: (*MonitorServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "ReportSystemInfo",
			Handler:    _MonitorService_ReportSystemInfo_Handler,
		},
	},
	Streams: []grpc.StreamDesc{
		{
			StreamName:    "ReportSystemState",
			Handler:       _MonitorService_ReportSystemState_Handler,
			ClientStreams: true,
		},
	},
	Metadata: "proto/monitor.proto",
}

func _MonitorService_ReportSystemInfo_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(Host)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(MonitorServiceServer).ReportSystemInfo(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/proto.MonitorService/ReportSystemInfo",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(MonitorServiceServer).ReportSystemInfo(ctx, req.(*Host))
	}
	return interceptor(ctx, in, info, handler)
}

func _MonitorService_ReportSystemState_Handler(srv interface{}, stream grpc.ServerStream) error {
	return srv.(MonitorServiceServer).ReportSystemState(&monitorServiceReportSystemStateServer{stream})
}

// RegisterMonitorServiceServer registers the MonitorServiceServer with a gRPC server.
func RegisterMonitorServiceServer(s grpc.ServiceRegistrar, srv MonitorServiceServer) {
	s.RegisterService(&MonitorService_ServiceDesc, srv)
}
